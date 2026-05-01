"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Search } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Subscription, SubscriptionDraft } from "@/lib/types";

// ── Tokens ────────────────────────────────────────────────────────────────────

const DARK_T = {
  s1: '#141927', s2: '#1b2236', s3: '#222d42',
  border: 'rgba(255,255,255,0.07)', text: '#eef2ff',
  sub: '#7b8799', accent: '#5b8def',
};
const LIGHT_T = {
  s1: 'rgba(255,255,255,0.95)', s2: '#f3f5f9', s3: '#eaecf2',
  border: '#e4e7ee', text: '#111827',
  sub: '#6b7280', accent: '#4f77b8',
};

function useTokens() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? DARK_T : LIGHT_T;
}

// ── Known services ────────────────────────────────────────────────────────────

const KNOWN_SERVICES = [
  { key: "chatgpt",        label: "ChatGPT"      },
  { key: "claude",         label: "Claude"        },
  { key: "netflix",        label: "Netflix"       },
  { key: "icloud-plus",    label: "iCloud+"       },
  { key: "perplexity",     label: "Perplexity"    },
  { key: "google-ai-pro",  label: "Google AI"     },
  { key: "digitalocean",   label: "DigitalOcean"  },
  { key: "github-copilot", label: "Copilot"       },
  { key: "apple-tv-plus",  label: "Apple TV+"     },
] as const;

// ── Draft helpers ─────────────────────────────────────────────────────────────

function toDraft(subscription?: Subscription): SubscriptionDraft {
  if (!subscription) {
    return {
      name: "", logoKey: "chatgpt", amount: "", currency: "EUR",
      billingCycle: "monthly", categoryId: "ai", paymentMethodId: "apple-card",
      rewards: "", startDate: new Date().toISOString().slice(0, 10),
      status: "active", notes: "",
    };
  }
  return {
    id: subscription.id,
    name: subscription.name,
    logoKey: subscription.logoKey,
    amount: (subscription.amountCents / 100).toFixed(2),
    currency: subscription.currency,
    billingCycle: subscription.billingCycle,
    categoryId: subscription.categoryId,
    paymentMethodId: subscription.paymentMethodId,
    rewards: subscription.rewards ?? "",
    startDate: subscription.startDate,
    status: subscription.status,
    notes: subscription.notes,
  };
}

// ── Shared state hook ─────────────────────────────────────────────────────────

function useFormState(subscription?: Subscription) {
  const { data, addOrUpdateSubscription } = useAppData();
  const [draft, setDraft] = useState<SubscriptionDraft>(() => toDraft(subscription));
  const [iconSearch, setIconSearch] = useState("");
  const [iconResults, setIconResults] = useState<
    Array<{ slug: string; title: string; hex: string; path: string; svglRoute?: string }>
  >([]);

  useEffect(() => {
    setDraft(toDraft(subscription));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.id]);

  useEffect(() => {
    if (!iconSearch.trim()) { setIconResults([]); return; }
    let cancelled = false;
    Promise.all([
      import("@/lib/svgl").then(({ searchSvgl }) => searchSvgl(iconSearch)),
      import("@/lib/icons").then(({ searchIcons }) => searchIcons(iconSearch)),
    ]).then(([svglResults, simpleResults]) => {
      if (cancelled) return;
      const svglSlugs = new Set(svglResults.map((r) => r.slug));
      const merged = [
        ...svglResults.map((r) => ({ slug: r.slug, title: r.title, hex: "", path: "", svglRoute: r.route })),
        ...simpleResults.filter((r) => !svglSlugs.has(r.slug)).slice(0, 24 - svglResults.length),
      ];
      setIconResults(merged.slice(0, 24));
    });
    return () => { cancelled = true; };
  }, [iconSearch]);

  function update<K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(onDone: () => void) {
    if (!draft.name || !draft.amount) return;
    addOrUpdateSubscription(draft);
    onDone();
  }

  return { data, draft, update, submit, iconSearch, setIconSearch, iconResults };
}

// ── Mobile-only detect ────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

// ── Public component ──────────────────────────────────────────────────────────

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={() => onOpenChange(false)}>
        {open && (
          <MobileFormBody
            key={`${subscription?.id ?? 'new'}-${open}`}
            subscription={subscription}
            onClose={() => onOpenChange(false)}
          />
        )}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <DesktopFormBody
            key={`${subscription?.id ?? 'new'}-${open}`}
            onOpenChange={onOpenChange}
            subscription={subscription}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── Mobile form (hi-fi style) ─────────────────────────────────────────────────

function MobileFormBody({
  subscription,
  onClose,
}: {
  subscription?: Subscription;
  onClose: () => void;
}) {
  const T = useTokens();
  const { data, draft, update, submit, iconSearch, setIconSearch, iconResults } =
    useFormState(subscription);

  const isEdit = !!subscription;

  return (
    <div style={{ padding: '4px 16px 32px' }}>
      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: -0.5, marginBottom: 16 }}>
        {isEdit ? 'Abo bearbeiten' : 'Abo hinzufügen'}
      </div>

      {/* Search */}
      <div style={{
        background: T.s3, border: `1px solid ${T.border}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 18,
      }}>
        <Search size={16} color={T.sub} />
        <input
          value={iconSearch}
          onChange={(e) => {
            setIconSearch(e.target.value);
            if (e.target.value) update('name', e.target.value);
          }}
          placeholder="Service suchen…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 15, color: T.text,
          }}
        />
      </div>

      {/* Icon search results */}
      {iconResults.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18,
        }}>
          {iconResults.slice(0, 6).map((icon) => (
            <button
              key={icon.slug}
              type="button"
              onClick={() => {
                update('logoKey', icon.slug);
                update('name', icon.title);
                setIconSearch('');
              }}
              style={{
                background: T.s2, border: `1px solid ${T.border}`, borderRadius: 14,
                padding: '12px 8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 7, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: icon.svglRoute ? '#f5f5f5' : `#${icon.hex}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {icon.svglRoute ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon.svglRoute} alt={icon.title} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                ) : (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill={`#${icon.hex}`}>
                    <path d={icon.path} />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.text, textAlign: 'center' }}>
                {icon.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Popular grid (shown when not searching) */}
      {!iconSearch && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 600, color: T.sub,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
          }}>
            Beliebt
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            {KNOWN_SERVICES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => { update('logoKey', s.key); update('name', s.label); }}
                style={{
                  background: draft.logoKey === s.key ? `${T.accent}18` : T.s2,
                  border: `1px solid ${draft.logoKey === s.key ? T.accent : T.border}`,
                  borderRadius: 14, padding: '12px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  cursor: 'pointer',
                }}
              >
                <BrandAvatar logoKey={s.key} name={s.label} className="size-10 rounded-[10px]" compact />
                <span style={{ fontSize: 11, fontWeight: 500, color: T.text, textAlign: 'center' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Manual fields */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: T.sub,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
      }}>
        Manuell
      </div>
      <div style={{
        background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16,
        overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Name */}
        <FieldRow label="Name" border>
          <input
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="z.B. Spotify"
            required
            style={{
              background: 'none', border: 'none', outline: 'none', textAlign: 'right',
              fontSize: 14, fontWeight: 500, color: T.accent, width: '100%',
            }}
          />
        </FieldRow>

        {/* Betrag */}
        <FieldRow label="Betrag" border>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <input
              value={draft.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              required
              style={{
                background: 'none', border: 'none', outline: 'none', textAlign: 'right',
                fontSize: 14, fontWeight: 500, color: T.accent, width: 70,
              }}
            />
            <select
              value={draft.currency}
              onChange={(e) => update('currency', e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: T.sub, cursor: 'pointer',
              }}
            >
              {['EUR', 'USD', 'TRY', 'INR'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </FieldRow>

        {/* Zyklus */}
        <FieldRow label="Zyklus" border>
          <select
            value={draft.billingCycle}
            onChange={(e) => update('billingCycle', e.target.value as SubscriptionDraft['billingCycle'])}
            style={{
              background: 'none', border: 'none', outline: 'none', textAlign: 'right',
              fontSize: 14, fontWeight: 500, color: T.accent, cursor: 'pointer',
            }}
          >
            <option value="monthly">Monatlich</option>
            <option value="quarterly">Quartalsweise</option>
            <option value="yearly">Jährlich</option>
          </select>
        </FieldRow>

        {/* Startdatum */}
        <FieldRow label="Startdatum" border>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none', textAlign: 'right',
              fontSize: 14, fontWeight: 500, color: T.accent, cursor: 'pointer',
            }}
          />
        </FieldRow>

        {/* Kategorie */}
        <FieldRow label="Kategorie">
          <select
            value={draft.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none', textAlign: 'right',
              fontSize: 14, fontWeight: 500, color: T.accent, cursor: 'pointer',
            }}
          >
            {data.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </FieldRow>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => submit(onClose)}
        style={{
          width: '100%', padding: 16, borderRadius: 16,
          background: T.accent, border: 'none', cursor: 'pointer',
          textAlign: 'center', boxShadow: `0 6px 20px ${T.accent}55`,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          {isEdit ? 'Speichern' : 'Hinzufügen'}
        </span>
      </button>
    </div>
  );
}

function FieldRow({
  label,
  children,
  border,
}: {
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  const T = useTokens();
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 16px',
      borderBottom: border ? `1px solid ${T.border}` : 'none',
    }}>
      <span style={{ fontSize: 14, color: T.sub }}>{label}</span>
      <div style={{ color: T.accent, fontSize: 14 }}>{children}</div>
    </div>
  );
}

// ── Desktop form (unchanged) ──────────────────────────────────────────────────

function DesktopFormBody({
  onOpenChange,
  subscription,
}: {
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
}) {
  const { data, draft, update, submit, iconSearch, setIconSearch, iconResults } =
    useFormState(subscription);

  const isKnownKey = KNOWN_SERVICES.some((s) => s.key === draft.logoKey);
  const [customKey, setCustomKey] = useState(!isKnownKey ? draft.logoKey : "");
  const [useCustom, setUseCustom] = useState(!isKnownKey && draft.logoKey !== "");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{subscription ? "Edit subscription" : "Add subscription"}</DialogTitle>
        <DialogDescription>
          Keep the catalog accurate with billing details, notes, and payment mapping.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); submit(() => onOpenChange(false)); }}
      >
        {/* Service identity */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b0b6c4]">
            Service
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#475569]">Name</span>
            <Input
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="ChatGPT"
              required
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-[#475569]">Icon</span>
            <div className="grid grid-cols-5 gap-2">
              {KNOWN_SERVICES.map((service) => (
                <button
                  key={service.key}
                  type="button"
                  onClick={() => {
                    update("logoKey", service.key);
                    setIconSearch("");
                    setUseCustom(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[12px] border p-2 text-[10px] transition",
                    draft.logoKey === service.key && !iconSearch && !useCustom
                      ? "border-[#5e8cff] bg-[#eff4ff] text-[#4f77b8]"
                      : "border-[#eef0f5] bg-white text-[#9aa5b8] hover:border-[#d0d8ee]",
                  )}
                >
                  <BrandAvatar
                    logoKey={service.key}
                    name={service.label}
                    className="size-8 rounded-[8px]"
                    compact
                  />
                  <span className="truncate w-full text-center leading-tight">{service.label}</span>
                </button>
              ))}
            </div>

            <Input
              value={iconSearch}
              onChange={(e) => {
                const val = e.target.value;
                setIconSearch(val);
                if (!val.trim()) setUseCustom(false);
              }}
              placeholder="Search service… (3 000+ icons)"
            />

            {iconResults.length > 0 && (
              <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto rounded-[12px] border border-[#eef0f5] p-2">
                {iconResults.map((icon) => (
                  <button
                    key={icon.slug}
                    type="button"
                    onClick={() => {
                      update("logoKey", icon.slug);
                      setIconSearch("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-[12px] border p-2 text-[10px] transition",
                      draft.logoKey === icon.slug
                        ? "border-[#5e8cff] bg-[#eff4ff] text-[#4f77b8]"
                        : "border-[#eef0f5] bg-white text-[#9aa5b8] hover:border-[#d0d8ee]",
                    )}
                  >
                    <div
                      className="flex size-8 items-center justify-center overflow-hidden rounded-[8px]"
                      style={{ backgroundColor: icon.svglRoute ? '#f5f5f5' : `#${icon.hex}1a` }}
                    >
                      {icon.svglRoute ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon.svglRoute} alt={icon.title} className="size-6 object-contain" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="size-5" fill={`#${icon.hex}`}>
                          <path d={icon.path} />
                        </svg>
                      )}
                    </div>
                    <span className="truncate w-full text-center leading-tight">{icon.title}</span>
                  </button>
                ))}
              </div>
            )}

            {useCustom && (
              <Input
                value={customKey}
                onChange={(event) => {
                  setCustomKey(event.target.value);
                  update("logoKey", event.target.value);
                }}
                placeholder="e.g. spotify"
              />
            )}
          </div>
        </div>

        {/* Cost */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b0b6c4]">
            Cost
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Amount</span>
              <Input
                value={draft.amount}
                onChange={(event) => update("amount", event.target.value)}
                placeholder="19,99"
                inputMode="decimal"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Currency</span>
              <Select value={draft.currency} onValueChange={(value) => update("currency", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EUR','USD','TRY','INR'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Billing cycle</span>
              <Select
                value={draft.billingCycle}
                onValueChange={(value) => update("billingCycle", value as SubscriptionDraft["billingCycle"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b0b6c4]">
            Details
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Start date</span>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Category</span>
              <Select value={draft.categoryId} onValueChange={(value) => update("categoryId", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Status</span>
              <Select
                value={draft.status}
                onValueChange={(value) => update("status", value as SubscriptionDraft["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b0b6c4]">
            Payment
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Payment method</span>
              <Select
                value={draft.paymentMethodId}
                onValueChange={(value) => update("paymentMethodId", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Rewards</span>
              <Input
                value={draft.rewards}
                onChange={(event) => update("rewards", event.target.value)}
                placeholder="Membership Rewards"
              />
            </label>
          </div>
        </div>

        {/* Notes */}
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#475569]">Notes</span>
          <Textarea
            value={draft.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Renewal notes, account sharing, and plan context."
          />
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{subscription ? "Save changes" : "Create entry"}</Button>
        </div>
      </form>
    </>
  );
}
