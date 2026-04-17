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
    (total, subscription) => total + subscription.amountCents,
    0,
  );

  if (!ready) {
    return <Card className="h-56 animate-pulse bg-white/80" />;
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.04em] text-[#4b5263] sm:hidden">
                    Subscriptions
                  </div>
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
                  className="h-10 rounded-[14px] pl-9 text-[13px]"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 rounded-[14px] text-[12px]">
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
                  <SelectTrigger className="h-10 rounded-[14px] text-[12px]">
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
                        ? "border-[#dce7ff] shadow-[0_20px_44px_-30px_rgba(59,130,246,0.28)]"
                        : ""
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
                          <div>{formatDateLabel(subscription.nextDueDate)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden xl:block xl:self-start">
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
