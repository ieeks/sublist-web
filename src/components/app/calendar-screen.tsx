"use client";

import { useMemo, useState } from "react";
import { parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { MobileDetailSheet } from "@/components/app/mobile-detail-sheet";
import { SubscriptionFormDialog } from "@/components/app/subscription-form-dialog";
import { useAppData } from "@/components/providers/app-providers";
import { advanceDate, formatCurrency } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG     = '#0c101c';
const S1     = '#141927';
const BORDER = '#252c3d';
const ACCENT = '#5b8def';
const TEXT   = '#e8eaf0';
const SUB    = '#7a8399';

// ── i18n labels ───────────────────────────────────────────────────────────────
const WEEKDAYS   = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS_DE  = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SH  = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WEEKDAY_SH = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns day-of-month numbers when a subscription renews in [year, month]. */
function getOccurrenceDays(sub: Subscription, year: number, month: number): number[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);
  let cursor = parseISO(sub.startDate);
  const days: number[] = [];

  while (cursor <= monthEnd) {
    if (cursor >= monthStart) {
      days.push(cursor.getDate());
    }
    cursor = advanceDate(cursor, sub.billingCycle);
  }
  return days;
}

/** Builds { [dayOfMonth]: Subscription[] } for active subscriptions in a month. */
function buildCalEvents(
  subscriptions: Subscription[],
  year: number,
  month: number,
): Record<number, Subscription[]> {
  return subscriptions
    .filter((s) => s.status !== 'archived')
    .reduce<Record<number, Subscription[]>>((map, sub) => {
      for (const day of getOccurrenceDays(sub, year, month)) {
        map[day] = [...(map[day] ?? []), sub];
      }
      return map;
    }, {});
}

/** Weekday offset so Monday = column 0. */
function monthOffset(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Renewal date label in German: "Mo, Apr 14" */
function renewalLabel(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return `${WEEKDAY_SH[d.getDay()]}, ${MONTHS_SH[month]} ${day}`;
}

/** Cycle label. */
function cycleLabel(sub: Subscription): string {
  if (sub.billingCycle === 'monthly')   return 'Monatlich';
  if (sub.billingCycle === 'quarterly') return 'Quartalsweise';
  return 'Jährlich';
}

/** Returns category color or a stable fallback. */
function subColor(sub: Subscription, categories: Array<{ id: string; color: string }>): string {
  return categories.find((c) => c.id === sub.categoryId)?.color ?? ACCENT;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CalendarScreen() {
  const { data } = useAppData();

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [detailSheetId, setDetailSheetId] = useState<string | undefined>();
  const [editingSub, setEditingSub] = useState<Subscription | undefined>();

  // Navigate months
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else             { setMonth(m => m - 1); }
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else              { setMonth(m => m + 1); }
    setSelectedDay(null);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = monthOffset(year, month);

  const calEvents = useMemo(
    () => buildCalEvents(data.subscriptions, year, month),
    [data.subscriptions, year, month],
  );

  // Renewal list: one entry per (sub × occurrence), sorted by day
  const renewalItems = useMemo(() => {
    const items: Array<{ sub: Subscription; day: number }> = [];
    for (const [dayStr, subs] of Object.entries(calEvents)) {
      const day = Number(dayStr);
      for (const sub of subs) {
        items.push({ sub, day });
      }
    }
    return items.sort((a, b) => a.day - b.day);
  }, [calEvents]);

  // Day panel entries
  const dayPanelItems = selectedDay !== null ? (calEvents[selectedDay] ?? []) : [];

  function handleDayTap(day: number) {
    if ((calEvents[day] ?? []).length === 0) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay(prev => (prev === day ? null : day));
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div style={{ background: BG, minHeight: '100%', padding: '0 0 40px' }}>
      {/* Month navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 16px 16px',
      }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: S1, border: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: TEXT,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>
          {MONTHS_DE[month]} {year}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: S1, border: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: TEXT,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 16px', marginBottom: 6,
      }}>
        {WEEKDAYS.map((label) => (
          <div key={label} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600,
            color: SUB, letterSpacing: '0.04em',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4, padding: '0 16px',
      }}>
        {/* Leading empty cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day      = i + 1;
          const isToday  = isCurrentMonth && day === today.getDate();
          const subs     = calEvents[day] ?? [];
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayTap(day)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 2px 6px', borderRadius: 10,
                background: isSelected ? `${ACCENT}22` : 'transparent',
                border: 'none', cursor: subs.length > 0 ? 'pointer' : 'default',
                minHeight: 52,
              }}
            >
              {/* Day number */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isToday ? ACCENT : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: isToday ? 700 : 400,
                color: isToday ? '#fff' : TEXT,
                marginBottom: 4,
              }}>
                {day}
              </div>

              {/* Event dots */}
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 24 }}>
                {subs.slice(0, 3).map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: subColor(sub, data.categories),
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day panel */}
      {selectedDay !== null && dayPanelItems.length > 0 && (
        <div style={{
          margin: '16px 16px 0',
          background: S1, borderRadius: 16,
          border: `1px solid ${BORDER}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px 8px',
            fontSize: 13, fontWeight: 600, color: TEXT,
          }}>
            {MONTHS_DE[month]} {selectedDay}
          </div>
          {dayPanelItems.map((sub, idx) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setDetailSheetId(sub.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 16px',
                background: 'none', border: 'none',
                borderTop: idx === 0 ? `1px solid ${BORDER}` : undefined,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <BrandAvatar
                logoKey={sub.logoKey}
                name={sub.name}
                className="size-[38px] rounded-[9px] shrink-0"
                compact
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: SUB }}>{cycleLabel(sub)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, flexShrink: 0 }}>
                {formatCurrency(sub.amountCents, sub.currency)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Renewal list */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 12 }}>
          Verlängerungen
        </div>
        <div>
          {renewalItems.length === 0 ? (
            <div style={{ fontSize: 14, color: SUB, textAlign: 'center', padding: '24px 0' }}>
              Keine Verlängerungen diesen Monat.
            </div>
          ) : (
            renewalItems.map(({ sub, day }, idx) => (
              <button
                key={`${sub.id}-${day}`}
                type="button"
                onClick={() => setDetailSheetId(sub.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 0',
                  background: 'none', border: 'none',
                  borderBottom: idx < renewalItems.length - 1 ? `1px solid ${BORDER}` : undefined,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <BrandAvatar
                  logoKey={sub.logoKey}
                  name={sub.name}
                  className="size-[38px] rounded-[9px] shrink-0"
                  compact
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: SUB }}>{renewalLabel(year, month, day)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, flexShrink: 0 }}>
                  {formatCurrency(sub.amountCents, sub.currency)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail sheet */}
      <MobileDetailSheet
        subscriptionId={detailSheetId}
        open={detailSheetId !== undefined}
        onClose={() => setDetailSheetId(undefined)}
        onEdit={() => {
          const sub = data.subscriptions.find((s) => s.id === detailSheetId);
          setEditingSub(sub);
          setDetailSheetId(undefined);
        }}
      />

      {/* Edit dialog */}
      <SubscriptionFormDialog
        open={editingSub !== undefined}
        subscription={editingSub}
        onOpenChange={(open) => { if (!open) setEditingSub(undefined); }}
      />
    </div>
  );
}
