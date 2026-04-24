"use client";

import { useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronRight, Download, FolderUp } from "lucide-react";

import { useAppData } from "@/components/providers/app-providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseSubscriptionsCsv, paymentHistoryToCsv, subscriptionsToCsv } from "@/lib/csv";

// ── Helpers ────────────────────────────────────────────────────────────────────

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const DARK = {
  s1:     '#141927',
  s3:     '#222d42',
  border: 'rgba(255,255,255,0.07)',
  text:   '#eef2ff',
  sub:    '#7b8799',
  accent: '#5b8def',
};

const LIGHT = {
  s1:     'rgba(255,255,255,0.9)',
  s3:     '#f1f3f7',
  border: '#e4e7ee',
  text:   '#111827',
  sub:    '#6b7280',
  accent: '#4f77b8',
};

function useTokens() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? DARK : LIGHT;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const T = useTokens();
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: T.sub,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 8, paddingLeft: 4,
      }}>
        {title}
      </div>
      <div style={{
        background: T.s1, borderRadius: 16,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  last,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
  onClick?: () => void;
}) {
  const T = useTokens();
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: last ? 'none' : `1px solid ${T.border}`,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <span style={{ fontSize: 15, color: T.text }}>{label}</span>
      <div style={{ color: T.sub, fontSize: 14 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const T = useTokens();
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? T.accent : T.s3,
        border: `1px solid ${on ? T.accent : T.border}`,
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, width: 20, height: 20,
        borderRadius: '50%', background: '#fff',
        left: on ? 22 : 2, transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const {
    data,
    updateSettings,
    importSubscriptions,
  } = useAppData();
  const { resolvedTheme } = useTheme();
  const T = useTokens();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencyTriggerRef = useRef<HTMLButtonElement>(null);

  // Notification state (local placeholder — no backend yet)
  const [notify3days, setNotify3days] = useState(true);
  const [notifyOnDay, setNotifyOnDay] = useState(false);

  // Category summary derived from actual state
  const catSummary = useMemo(() => {
    return data.categories.map((cat) => ({
      id:    cat.id,
      name:  cat.name,
      color: cat.color,
      count: data.subscriptions.filter(
        (s) => s.categoryId === cat.id && s.status !== 'archived',
      ).length,
    }));
  }, [data.categories, data.subscriptions]);

  const isDark = resolvedTheme === 'dark';

  function toggleAppearance() {
    updateSettings({ appearance: isDark ? 'light' : 'dark' });
  }

  return (
    <div style={{ padding: '0 16px 32px' }}>
      {/* Title */}
      <div style={{
        fontSize: 26, fontWeight: 700, color: T.text,
        letterSpacing: -0.8, padding: '4px 4px 20px',
      }}>
        Einstellungen
      </div>

      {/* ── Darstellung ── */}
      <Group title="Darstellung">
        <Row label="Dark Mode" onClick={toggleAppearance}>
          <Toggle on={isDark} onToggle={toggleAppearance} />
        </Row>

        <Row label="Währung" last onClick={() => currencyTriggerRef.current?.click()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Select
              value={data.settings.defaultCurrency}
              onValueChange={(value) => updateSettings({ defaultCurrency: value })}
            >
              <SelectTrigger
                ref={currencyTriggerRef}
                style={{
                  border: 'none', background: 'transparent', boxShadow: 'none',
                  padding: 0, height: 'auto', gap: 4,
                  fontSize: 14, fontWeight: 500, color: T.accent,
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['EUR', 'USD', 'GBP', 'TRY', 'INR'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ChevronRight size={14} color={T.sub} />
          </div>
        </Row>
      </Group>

      {/* ── Kategorien ── */}
      <Group title="Kategorien">
        {catSummary.length === 0 ? (
          <Row label="Keine Kategorien" last>
            <span style={{ fontSize: 13, color: T.sub }}>—</span>
          </Row>
        ) : (
          catSummary.map((cat, i) => (
            <Row key={cat.id} label={cat.name} last={i === catSummary.length - 1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: cat.color,
                }} />
                <span style={{ fontSize: 13, color: T.sub }}>
                  {cat.count} Abo{cat.count !== 1 ? 's' : ''}
                </span>
                <ChevronRight size={14} color={T.sub} />
              </div>
            </Row>
          ))
        )}
      </Group>

      {/* ── Benachrichtigungen ── */}
      <Group title="Benachrichtigungen">
        <Row label="3 Tage vorher" onClick={() => setNotify3days((v) => !v)}>
          <Toggle on={notify3days} onToggle={() => setNotify3days((v) => !v)} />
        </Row>
        <Row label="Am Verlängerungstag" last onClick={() => setNotifyOnDay((v) => !v)}>
          <Toggle on={notifyOnDay} onToggle={() => setNotifyOnDay((v) => !v)} />
        </Row>
      </Group>

      {/* ── Daten ── */}
      <Group title="Daten">
        {[
          {
            label:  'Abos exportieren (CSV)',
            icon:   Download,
            color:  T.accent,
            action: () => triggerDownload('subscriptions.csv', subscriptionsToCsv(data.subscriptions)),
          },
          {
            label:  'Zahlungshistorie exportieren',
            icon:   Download,
            color:  T.accent,
            action: () => triggerDownload('payment-history.csv', paymentHistoryToCsv(data.paymentHistory)),
          },
          {
            label:  'CSV importieren',
            icon:   FolderUp,
            color:  '#f97316',
            action: () => fileInputRef.current?.click(),
          },
        ].map(({ label, icon: Icon, color, action }, i, arr) => (
          <div
            key={label}
            onClick={action}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px', cursor: 'pointer',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
            }}
          >
            <Icon size={18} color={color} />
            <span style={{ fontSize: 15, fontWeight: 500, color }}>{label}</span>
          </div>
        ))}
      </Group>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const content = await file.text();
          importSubscriptions(parseSubscriptionsCsv(content));
          e.target.value = '';
        }}
      />
    </div>
  );
}
