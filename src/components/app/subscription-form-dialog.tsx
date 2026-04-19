"use client";

import { useState } from "react";

import { BrandAvatar } from "@/components/app/brand-avatar";
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

const KNOWN_SERVICES = [
  { key: "chatgpt", label: "ChatGPT" },
  { key: "claude", label: "Claude" },
  { key: "netflix", label: "Netflix" },
  { key: "icloud-plus", label: "iCloud+" },
  { key: "perplexity", label: "Perplexity" },
  { key: "google-ai-pro", label: "Google AI" },
  { key: "digitalocean", label: "DigitalOcean" },
  { key: "github-copilot", label: "Copilot" },
  { key: "apple-tv-plus", label: "Apple TV+" },
] as const;

function toDraft(subscription?: Subscription): SubscriptionDraft {
  if (!subscription) {
    return {
      name: "",
      logoKey: "chatgpt",
      amount: "",
      currency: "EUR",
      billingCycle: "monthly",
      categoryId: "ai",
      paymentMethodId: "apple-card",
      rewards: "",
      startDate: new Date().toISOString().slice(0, 10),
      status: "active",
      notes: "",
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

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <SubscriptionFormBody
            key={`${subscription?.id ?? "new"}-${open ? "open" : "closed"}`}
            onOpenChange={onOpenChange}
            subscription={subscription}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionFormBody({
  onOpenChange,
  subscription,
}: {
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
}) {
  const { data, addOrUpdateSubscription } = useAppData();
  const [draft, setDraft] = useState<SubscriptionDraft>(() => toDraft(subscription));

  function update<K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name || !draft.amount) return;
    addOrUpdateSubscription(draft);
    onOpenChange(false);
  }

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

      <form className="space-y-5" onSubmit={handleSubmit}>
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
                    setUseCustom(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[12px] border p-2 text-[10px] transition",
                    draft.logoKey === service.key && !useCustom
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
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-[12px] border p-2 text-[10px] transition",
                  useCustom
                    ? "border-[#5e8cff] bg-[#eff4ff] text-[#4f77b8]"
                    : "border-[#eef0f5] bg-white text-[#9aa5b8] hover:border-[#d0d8ee]",
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-[8px] border border-[#eef0f5] text-lg font-semibold text-[#9aa5b8]">
                  ?
                </div>
                <span>Other</span>
              </button>
            </div>
            {useCustom && (
              <Input
                value={customKey}
                onChange={(event) => {
                  setCustomKey(event.target.value);
                  update("logoKey", event.target.value);
                }}
                placeholder="e.g. spotify"
                className="mt-1"
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
                placeholder="19.99"
                inputMode="decimal"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Currency</span>
              <Input
                value={draft.currency}
                onChange={(event) => update("currency", event.target.value.toUpperCase())}
                maxLength={3}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#475569]">Billing cycle</span>
              <Select
                value={draft.billingCycle}
                onValueChange={(value) =>
                  update("billingCycle", value as SubscriptionDraft["billingCycle"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
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
