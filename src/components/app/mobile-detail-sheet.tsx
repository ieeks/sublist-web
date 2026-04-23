"use client";

import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { useAppData } from "@/components/providers/app-providers";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { daysUntil, formatCurrency, summarizeTotalSpent } from "@/lib/utils";

interface MobileDetailSheetProps {
  subscriptionId?: string;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function MobileDetailSheet({
  subscriptionId,
  open,
  onClose,
  onEdit,
}: MobileDetailSheetProps) {
  const { data, deleteSubscription } = useAppData();
  const subscription = data.subscriptions.find((s) => s.id === subscriptionId);

  if (!subscription) return null;

  const category = data.categories.find((c) => c.id === subscription.categoryId);
  const paymentMethod = data.paymentMethods.find((m) => m.id === subscription.paymentMethodId);
  const history = data.paymentHistory
    .filter((e) => e.subscriptionId === subscription.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const totalSpent = summarizeTotalSpent(subscription.id, data.paymentHistory);
  const daysLeft = daysUntil(subscription.nextDueDate);
  const isUrgent = daysLeft <= 7;

  const cycleLabel =
    subscription.billingCycle === "monthly"
      ? "Monthly"
      : subscription.billingCycle === "quarterly"
        ? "Quarterly"
        : "Yearly";

  // History bar chart — max value for scaling
  const maxAmount = Math.max(...history.map((h) => h.amountCents), 1);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5">
        {/* Hero */}
        <div className="flex flex-col items-center pb-5 pt-2">
          <BrandAvatar
            logoKey={subscription.logoKey}
            name={subscription.name}
            className="size-14 rounded-[16px]"
          />
          <div className="mt-3 text-[18px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {subscription.name}
          </div>
          {category && (
            <span
              className="mt-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: `${category.color}22`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
          {/* Price hero */}
          <div className="mt-4 text-[42px] font-bold leading-none tracking-[-2px] text-[var(--text)]">
            {formatCurrency(subscription.amountCents, subscription.currency)}
          </div>
          <div className="mt-1 text-[13px] text-[var(--sub)]">{cycleLabel}</div>
        </div>

        {/* Info rows */}
        <div
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]"
          style={{ overflow: "hidden" }}
        >
          <InfoRow label="Next payment">
            <span style={{ color: isUrgent ? "#f97316" : "var(--text)", fontWeight: 600 }}>
              {isUrgent && "⚡ "}
              {format(new Date(subscription.nextDueDate), "MMM d")}
              <span className="ml-1 text-[12px] font-normal" style={{ color: isUrgent ? "#f97316" : "var(--sub)" }}>
                {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `in ${daysLeft}d`}
              </span>
            </span>
          </InfoRow>
          <InfoRow label="Billing cycle">
            <span className="font-medium text-[var(--text)]">{cycleLabel}</span>
          </InfoRow>
          {paymentMethod && (
            <InfoRow label="Payment">
              <span className="font-medium text-[var(--text)]">{paymentMethod.name}</span>
            </InfoRow>
          )}
          <InfoRow label="Total spent">
            <span className="font-medium text-[var(--text)]">
              {formatCurrency(totalSpent, subscription.currency)}
            </span>
          </InfoRow>
          {subscription.rewards && (
            <InfoRow label="Rewards" isLast>
              <span className="font-medium text-[var(--text)]">{subscription.rewards}</span>
            </InfoRow>
          )}
        </div>

        {/* Payment history bars */}
        {history.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 text-[13px] font-semibold text-[var(--text)]">
              Payment History
            </div>
            <div className="flex items-end gap-1.5 h-[52px]">
              {history.map((item) => {
                const heightPct = Math.max(20, Math.round((item.amountCents / maxAmount) * 100));
                return (
                  <div key={item.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-[4px]"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: "var(--accent)",
                        opacity: 0.7,
                      }}
                    />
                    <span className="text-[9px] text-[var(--sub)]">
                      {format(new Date(item.date), "MMM")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3 pb-2">
          <button
            type="button"
            className="sl-tap-target flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-[15px] font-semibold text-white"
            style={{
              background: "var(--accent)",
              boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
            onClick={() => { onClose(); onEdit(); }}
          >
            <Pencil className="size-4" />
            Edit
          </button>
          <button
            type="button"
            className="sl-tap-target flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-[15px] font-semibold"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#ef4444",
            }}
            onClick={() => {
              deleteSubscription(subscription.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function InfoRow({
  label,
  children,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={isLast ? undefined : { borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-[13px] text-[var(--sub)]">{label}</span>
      <span className="text-[13px]">{children}</span>
    </div>
  );
}
