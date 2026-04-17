"use client";

import { useState } from "react";

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
import type { Subscription, SubscriptionDraft } from "@/lib/types";

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

  return (
    <>
      <DialogHeader>
        <DialogTitle>{subscription ? "Edit subscription" : "Add subscription"}</DialogTitle>
        <DialogDescription>
          Keep the catalog accurate with billing details, notes, and payment mapping.
        </DialogDescription>
      </DialogHeader>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-[#475569]">Name</span>
          <Input
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="ChatGPT"
            required
          />
        </label>

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

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#475569]">Logo key</span>
          <Input
            value={draft.logoKey}
            onChange={(event) => update("logoKey", event.target.value)}
            placeholder="chatgpt"
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-[#475569]">Rewards</span>
          <Input
            value={draft.rewards}
            onChange={(event) => update("rewards", event.target.value)}
            placeholder="Membership Rewards"
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-[#475569]">Notes</span>
          <Textarea
            value={draft.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Renewal notes, account sharing, and plan context."
          />
        </label>

        <div className="flex justify-end gap-3 md:col-span-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{subscription ? "Save changes" : "Create entry"}</Button>
        </div>
      </form>
    </>
  );
}
