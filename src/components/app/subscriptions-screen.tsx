"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { SubscriptionFormDialog } from "@/components/app/subscription-form-dialog";
import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { convertCurrency, toEurCents } from "@/lib/currencies";
import { formatCurrency } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

export function SubscriptionsScreen() {
  const { data, ready, fxRates, deleteSubscription } = useAppData();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(data.subscriptions[0]?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const deferredQuery = useDeferredValue(query);
  const selectedFromQuery = searchParams.get("subscription") ?? undefined;

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

  const effectiveSelectedId = filteredSubscriptions.find((item) => item.id === selectedFromQuery)
    ? selectedFromQuery
    : filteredSubscriptions.find((item) => item.id === selectedId)
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

  const defaultCurrency = data.settings.defaultCurrency;

  const totalDue = filteredSubscriptions.reduce(
    (sum, sub) => sum + convertCurrency(sub.amountCents, sub.currency, defaultCurrency, fxRates),
    0,
  );

  if (!ready) {
    return <Card className="h-56 animate-pulse bg-white/80" />;
  }

  return (
    <>
      <div className="lg:hidden">
        <div className="mx-auto max-w-sm px-4 pt-7">
          <div className="flex items-center justify-between pb-6">
            <div className="text-[22px] font-semibold tracking-[-0.05em] text-[#4a5162]">
              Subscriptions
            </div>
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex size-12 items-center justify-center rounded-full border border-[#edf0f5] bg-white text-[#99a2b3] shadow-[0_10px_22px_-18px_rgba(15,23,42,0.16)]"
            >
              <Plus className="size-5" />
            </button>
          </div>

          <div className="rounded-[18px] bg-[#f3f4f7] px-4 py-3.5">
            <div className="flex items-center justify-between text-[13px] text-[#9eabbf]">
              <div>Total due</div>
              <div className="font-medium text-[#8491a6]">
                {formatCurrency(totalDue, defaultCurrency)}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filteredSubscriptions.map((subscription) => (
              <SwipeDeleteRow
                key={subscription.id}
                subscription={subscription}
                fxRates={fxRates}
                onEdit={() => {
                  setSelectedId(subscription.id);
                  openEditDialog(subscription);
                }}
                onDelete={() => deleteSubscription(subscription.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-5 lg:grid xl:grid-cols-[minmax(0,1fr)_276px]">
        <div className="space-y-4">
          <Card className="rounded-[24px]">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#a1a8b8]">Total due</div>
                  <div className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-[#4b5263]">
                    {formatCurrency(totalDue, defaultCurrency)}
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

          <div className="space-y-3">
            {filteredSubscriptions.map((subscription) => {
              const selected = effectiveSelectedId === subscription.id;
              const eurCents =
                subscription.currency !== "EUR"
                  ? toEurCents(subscription.amountCents, subscription.currency, fxRates)
                  : null;
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
                        ? "border-[#dce7ff] shadow-[0_18px_38px_-28px_rgba(59,130,246,0.18)]"
                        : undefined
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BrandAvatar
                          logoKey={subscription.logoKey}
                          name={subscription.name}
                          className="size-12 rounded-[14px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-[#4b5263]">
                            {subscription.name}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#9ca3af]">
                            {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                            {eurCents !== null && (
                              <span className="ml-1 text-[#b0b6c4]">
                                · {formatCurrency(eurCents, "EUR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-[10px] text-[#b0b6c4]">
                            <RotateCcw className="size-2.5" />
                            <span>Next</span>
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#a3aabd]">
                            {formatDateLabel(subscription.nextDueDate)}
                          </div>
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

function SwipeDeleteRow({
  subscription,
  fxRates,
  onEdit,
  onDelete,
}: {
  subscription: Subscription;
  fxRates: Record<string, number>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const startXRef = useRef(0);
  const REVEAL = 80;
  const isOpen = offsetX <= -(REVEAL / 2);

  const eurCents =
    subscription.currency !== "EUR"
      ? toEurCents(subscription.amountCents, subscription.currency, fxRates)
      : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-[24px]">
        {/* Red delete zone revealed on swipe */}
        <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-[24px] bg-[#ef4444]">
          <button
            type="button"
            aria-label={`Delete ${subscription.name}`}
            className="flex size-full items-center justify-center"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-5 text-white" />
          </button>
        </div>

        {/* Sliding card */}
        <div
          className="relative rounded-[24px] border border-[#ebedf2] bg-white px-5 py-5 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.14)]"
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: offsetX === 0 || isOpen ? "transform 0.25s ease" : undefined,
            willChange: "transform",
            touchAction: "pan-y",
          }}
          onTouchStart={(e) => {
            startXRef.current = e.touches[0].clientX;
          }}
          onTouchMove={(e) => {
            const dx = e.touches[0].clientX - startXRef.current;
            if (dx < 0) setOffsetX(Math.max(-REVEAL, dx));
            else if (isOpen && dx > 0) setOffsetX(Math.min(0, offsetX + dx));
          }}
          onTouchEnd={() => {
            if (offsetX < -(REVEAL / 2)) setOffsetX(-REVEAL);
            else setOffsetX(0);
          }}
          onClick={() => {
            if (isOpen) { setOffsetX(0); return; }
            onEdit();
          }}
        >
          <div className="flex items-center gap-4">
            <BrandAvatar
              logoKey={subscription.logoKey}
              name={subscription.name}
              className="size-14 rounded-[16px]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold tracking-[-0.04em] text-[#4b5263]">
                {subscription.name}
              </div>
              <div className="mt-1 text-[12px] text-[#8f9aac]">
                {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                {eurCents !== null && (
                  <span className="ml-1 text-[#b0b6c4]">
                    · {formatCurrency(eurCents, "EUR")}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-[46px] text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] text-[#b0b6c4]">
                <RotateCcw className="size-2.5" />
                <span>Next</span>
              </div>
              <div className="mt-0.5 text-[12px] font-medium text-[#8894a6]">
                {formatDateLabel(subscription.nextDueDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) { setConfirming(false); setOffsetX(0); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {subscription.name}?</DialogTitle>
            <DialogDescription>
              This will permanently delete this subscription and its payment history.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setConfirming(false); setOffsetX(0); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { onDelete(); setConfirming(false); }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDateLabel(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
