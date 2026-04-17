"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { SubscriptionFormDialog } from "@/components/app/subscription-form-dialog";
import { useAppData } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

export function SubscriptionsScreen() {
  const { data, ready } = useAppData();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const deferredQuery = useDeferredValue(query);

  const filteredSubscriptions = useMemo(
    () =>
      data.subscriptions
        .filter((subscription) =>
          showArchived
            ? subscription.status === "archived"
            : subscription.status !== "archived",
        )
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
    [data.subscriptions, showArchived, categoryFilter, paymentFilter, deferredQuery],
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

  if (!ready) {
    return <Card className="h-56 animate-pulse bg-white/50" />;
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.4fr_repeat(2,minmax(0,220px))_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search subscriptions"
                  className="pl-11"
                />
              </label>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
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
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  {data.paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between rounded-[24px] border border-black/6 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#475569]">
                  <SlidersHorizontal className="size-4" />
                  Archived only
                </div>
                <Switch checked={showArchived} onCheckedChange={setShowArchived} />
              </div>

              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                Add new
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-[#64748b]">
                  No subscriptions match the current filters.
                </CardContent>
              </Card>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const category = data.categories.find((item) => item.id === subscription.categoryId);
                const method = data.paymentMethods.find(
                  (item) => item.id === subscription.paymentMethodId,
                );
                const active = subscription.id === selectedId;

                return (
                  <button
                    type="button"
                    key={subscription.id}
                    onClick={() => setSelectedId(subscription.id)}
                    className="text-left"
                  >
                    <Card
                      className={
                        active
                          ? "border-[#bfd2ff] shadow-[0_36px_80px_-48px_rgba(79,70,229,0.55)]"
                          : undefined
                      }
                    >
                      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                          <BrandAvatar
                            logoKey={subscription.logoKey}
                            name={subscription.name}
                            className="size-16"
                          />
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                                {subscription.name}
                              </h2>
                              <Badge className="bg-[#f8fafc] capitalize text-[#64748b]">
                                {subscription.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-sm text-[#64748b]">
                              {category?.name} · {method?.name}
                            </div>
                          </div>
                        </div>

                        <div className="grid flex-1 gap-3 sm:grid-cols-3">
                          <DataPill label="Amount" value={formatCurrency(subscription.amountCents, subscription.currency)} />
                          <DataPill label="Cycle" value={subscription.billingCycle} />
                          <DataPill label="Next due" value={subscription.nextDueDate} />
                        </div>

                        <div className="flex gap-3 sm:justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(subscription);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
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

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[#f8fafc] px-4 py-3">
      <div className="text-[0.72rem] uppercase tracking-[0.22em] text-[#94a3b8]">{label}</div>
      <div className="mt-2 text-sm font-semibold capitalize text-[#111827]">{value}</div>
    </div>
  );
}
