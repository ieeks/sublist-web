"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { SubscriptionFormDialog } from "@/components/app/subscription-form-dialog";
import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

export function SubscriptionsScreen() {
  const { data, ready } = useAppData();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(data.subscriptions[0]?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const deferredQuery = useDeferredValue(query);

  const filteredSubscriptions = useMemo(
    () =>
      data.subscriptions
        .filter((subscription) => subscription.status !== "archived")
        .filter((subscription) =>
          categoryFilter === "all" ? true : subscription.categoryId === categoryFilter,
        )
        .filter((subscription) =>
          paymentFilter === "all" ? true : subscription.paymentMethodId === paymentFilter,
        )
        .filter((subscription) =>
          subscription.name.toLowerCase().includes(deferredQuery.toLowerCase()),
        )
        .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate)),
    [categoryFilter, data.subscriptions, deferredQuery, paymentFilter],
  );

  const effectiveSelectedId = filteredSubscriptions.find((item) => item.id === selectedId)
    ? selectedId
    : filteredSubscriptions[0]?.id;

  function openCreateDialog() {
    setEditingSubscription(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(subscription: Subscription) {
    setEditingSubscription(subscription);
    setDialogOpen(true);
  }

  const totalDue = filteredSubscriptions.reduce(
    (sum, subscription) => sum + subscription.amountCents,
    0,
  );

  if (!ready) {
    return <Card className="h-56 animate-pulse bg-white/80" />;
  }

  return (
    <>
      <div className="lg:hidden">
        <div className="mx-auto max-w-sm rounded-[26px] bg-white px-4 pb-4 pt-3 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between pb-3">
            <div className="text-[22px] font-semibold tracking-[-0.05em] text-[#4a5162]">
              Subscriptions
            </div>
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex size-8 items-center justify-center rounded-full border border-[#edf0f5] bg-[#fafbfe] text-[#99a2b3]"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="rounded-[18px] bg-[#fbfcff] p-3">
            <div className="text-[10px] text-[#aab1c0]">Total due</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-[#4b5263]">
                {formatCurrency(totalDue, data.settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-[#aab1c0]">
                {filteredSubscriptions.length} items
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {filteredSubscriptions.map((subscription) => (
              <button
                type="button"
                key={subscription.id}
                onClick={() => {
                  setSelectedId(subscription.id);
                  openEditDialog(subscription);
                }}
                className="block w-full text-left"
              >
                <div className="rounded-[18px] border border-[#eef0f5] bg-white px-3 py-3 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.12)]">
                  <div className="flex items-center gap-3">
                    <BrandAvatar
                      logoKey={subscription.logoKey}
                      name={subscription.name}
                      className="size-11 rounded-[12px]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#4b5263]">
                        {subscription.name}
                      </div>
                      <div className="text-[10px] text-[#9ca3af]">
                        {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-[#99a2b3]">
                      {formatDateLabel(subscription.nextDueDate)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-4 lg:grid xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#a1a8b8]">Total due</div>
                  <div className="mt-1 text-[22px] font-semibold tracking-[-0.05em] text-[#4b5263]">
                    {formatCurrency(totalDue, data.settings.defaultCurrency)}
                  </div>
                </div>
                <Button onClick={openCreateDialog} size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#b0b6c4]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="pl-9"
                />
              </label>

              <div className="grid gap-2 xl:grid-cols-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    {data.paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {filteredSubscriptions.map((subscription) => {
              const selected = effectiveSelectedId === subscription.id;
              return (
                <button
                  type="button"
                  key={subscription.id}
                  onClick={() => setSelectedId(subscription.id)}
                  className="block w-full text-left"
                >
                  <Card
                    className={
                      selected
                        ? "border-[#dce7ff] shadow-[0_18px_38px_-28px_rgba(59,130,246,0.2)]"
                        : undefined
                    }
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <BrandAvatar
                          logoKey={subscription.logoKey}
                          name={subscription.name}
                          className="size-11 rounded-[12px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-[#4b5263]">
                            {subscription.name}
                          </div>
                          <div className="text-[11px] text-[#9ca3af]">
                            {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-[#a3aabd]">
                          {formatDateLabel(subscription.nextDueDate)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        <div className="self-start">
          <SubscriptionDetail
            subscriptionId={effectiveSelectedId}
            onEdit={() => {
              const subscription = data.subscriptions.find(
                (item) => item.id === effectiveSelectedId,
              );
              if (subscription) openEditDialog(subscription);
            }}
          />
        </div>
      </div>

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={editingSubscription}
      />
    </>
  );
}

function formatDateLabel(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
