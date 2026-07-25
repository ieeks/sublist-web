"use client";

import { useEffect, useDeferredValue, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { LoadingSpinner } from "@/components/app/loading-spinner";
import { MobileDetailSheet } from "@/components/app/mobile-detail-sheet";
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
import {
  daysUntil,
  formatCurrency,
  summarizeTotalSpent,
  toMonthlyAmount,
} from "@/lib/utils";
import type { Subscription } from "@/lib/types";

export function SubscriptionsScreen() {
  const { data, ready, fxRates, deleteSubscription, updateSubscriptionStatus } = useAppData();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(data.subscriptions[0]?.id);
  const [detailSheetId, setDetailSheetId] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cycleFilter, setCycleFilter] = useState<'Alle' | 'Monatlich' | 'Jährlich'>('Alle');
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const deferredQuery = useDeferredValue(query);
  const selectedFromQuery = searchParams.get("subscription") ?? undefined;

  const archivedSubscriptions = useMemo(
    () =>
      data.subscriptions
        .filter((subscription) => subscription.status === "archived")
        .filter((subscription) =>
          subscription.name.toLowerCase().includes(deferredQuery.toLowerCase()),
        )
        .sort((left, right) =>
          (right.archivedAt ?? "").localeCompare(left.archivedAt ?? "") ||
          left.name.localeCompare(right.name),
        ),
    [data.subscriptions, deferredQuery],
  );

  const archivedCount = useMemo(
    () => data.subscriptions.filter((subscription) => subscription.status === "archived").length,
    [data.subscriptions],
  );

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
        .filter((subscription) => {
          if (cycleFilter === 'Monatlich') return subscription.billingCycle === 'monthly';
          if (cycleFilter === 'Jährlich')  return subscription.billingCycle === 'yearly';
          return true;
        })
        .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate)),
    [categoryFilter, cycleFilter, data.subscriptions, deferredQuery, paymentFilter],
  );

  const visibleSubscriptions =
    view === "archived" ? archivedSubscriptions : filteredSubscriptions;

  const effectiveSelectedId = visibleSubscriptions.find((item) => item.id === selectedFromQuery)
    ? selectedFromQuery
    : visibleSubscriptions.find((item) => item.id === selectedId)
      ? selectedId
      : visibleSubscriptions[0]?.id;

  function showActive(cycle: 'Alle' | 'Monatlich' | 'Jährlich') {
    setCycleFilter(cycle);
    setView("active");
  }

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
    (sum, sub) => sum + convertCurrency(toMonthlyAmount(sub.amountCents, sub.billingCycle), sub.currency, defaultCurrency, fxRates),
    0,
  );

  const archivedTotalSpent = archivedSubscriptions.reduce(
    (sum, sub) =>
      sum +
      convertCurrency(
        summarizeTotalSpent(sub.id, data.paymentHistory),
        sub.currency,
        defaultCurrency,
        fxRates,
      ),
    0,
  );

  const isArchiveView = view === "archived";

  if (!ready) return <LoadingSpinner />;

  return (
    <>
      {/* Mobile list */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-sm px-5 pt-4">
          {/* Header */}
          <div className="flex items-end justify-between pb-1">
            <div>
              <div
                className="text-[26px] font-bold tracking-[-0.8px]"
                style={{ color: "var(--text)" }}
              >
                {isArchiveView ? "Archiv" : "Abonnements"}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--sub)" }}>
                {isArchiveView ? (
                  <>
                    {archivedCount} archiviert · ausgegeben:{" "}
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {formatCurrency(archivedTotalSpent, defaultCurrency)}
                    </span>
                  </>
                ) : (
                  <>
                    Gesamt:{" "}
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {formatCurrency(totalDue, defaultCurrency)} / mo
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={openCreateDialog}
              className="sl-tap-target flex size-9 items-center justify-center rounded-[12px]"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 33%, transparent)",
                color: "#fff",
              }}
            >
              <Plus className="size-[18px]" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-4 pb-1">
            {(['Alle', 'Monatlich', 'Jährlich'] as const).map((f) => {
              const active = !isArchiveView && cycleFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => showActive(f)}
                  className="sl-tap-target shrink-0 px-3.5 py-1.5 rounded-[20px] text-[13px] transition-all"
                  style={{
                    background: active ? "var(--accent)" : "var(--surface-2)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : "var(--sub)",
                  }}
                >
                  {f}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setView(isArchiveView ? "active" : "archived")}
              className="sl-tap-target ml-auto flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] text-[13px] transition-all"
              style={{
                background: isArchiveView ? "var(--accent)" : "var(--surface-2)",
                border: `1px solid ${isArchiveView ? "var(--accent)" : "var(--border)"}`,
                fontWeight: isArchiveView ? 600 : 400,
                color: isArchiveView ? "#fff" : "var(--sub)",
              }}
            >
              <Archive className="size-3.5" />
              Archiv{archivedCount > 0 ? ` ${archivedCount}` : ""}
            </button>
          </div>

          {/* Subscription cards */}
          <div className="space-y-2 pt-3">
            {isArchiveView
              ? archivedSubscriptions.map((subscription) => (
                  <ArchivedRow
                    key={subscription.id}
                    subscription={subscription}
                    fxRates={fxRates}
                    onView={() => setDetailSheetId(subscription.id)}
                    onRestore={() => updateSubscriptionStatus(subscription.id, "active")}
                    onDelete={() => deleteSubscription(subscription.id)}
                  />
                ))
              : filteredSubscriptions.map((subscription) => (
                  <SwipeDeleteRow
                    key={subscription.id}
                    subscription={subscription}
                    fxRates={fxRates}
                    categories={data.categories}
                    onView={() => setDetailSheetId(subscription.id)}
                    onArchive={() => updateSubscriptionStatus(subscription.id, "archived")}
                    onDelete={() => deleteSubscription(subscription.id)}
                  />
                ))}

            {isArchiveView && archivedSubscriptions.length === 0 && (
              <EmptyArchiveHint />
            )}
          </div>
        </div>
      </div>

      {/* Mobile detail sheet */}
      <MobileDetailSheet
        subscriptionId={detailSheetId}
        open={detailSheetId !== undefined}
        onClose={() => setDetailSheetId(undefined)}
        onEdit={() => {
          const sub = data.subscriptions.find((s) => s.id === detailSheetId);
          if (sub) openEditDialog(sub);
        }}
      />

      <div className="hidden gap-5 lg:grid xl:grid-cols-[minmax(0,1fr)_276px]">
        <div className="space-y-4">
          <Card className="rounded-[24px]">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#a1a8b8]">
                    {isArchiveView ? "Archiviert · gesamt ausgegeben" : "Total due"}
                  </div>
                  <div className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-[#4b5263]">
                    {formatCurrency(
                      isArchiveView ? archivedTotalSpent : totalDue,
                      defaultCurrency,
                    )}
                  </div>
                </div>
                <Button onClick={openCreateDialog} size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>

              <div className="flex gap-1 rounded-[14px] bg-[#f4f5f8] p-1">
                {([
                  { key: "active" as const, label: "Aktiv" },
                  { key: "archived" as const, label: `Archiv${archivedCount > 0 ? ` (${archivedCount})` : ""}` },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setView(tab.key)}
                    className={`flex-1 rounded-[11px] px-3 py-1.5 text-[12px] font-medium transition ${
                      view === tab.key
                        ? "bg-white text-[#4b5263] shadow-[0_6px_14px_-10px_rgba(15,23,42,0.35)]"
                        : "text-[#98a1b2]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
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

              <div className={`grid gap-2 xl:grid-cols-2 ${isArchiveView ? "hidden" : ""}`}>
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
            {isArchiveView && visibleSubscriptions.length === 0 && <EmptyArchiveHint desktop />}

            {visibleSubscriptions.map((subscription) => {
              const selected = effectiveSelectedId === subscription.id;
              const archived = subscription.status === "archived";
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
                          className={`size-12 rounded-[14px] ${archived ? "opacity-60 grayscale" : ""}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-[#4b5263]">
                              {subscription.name}
                            </span>
                            {archived && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f7] px-2 py-0.5 text-[10px] font-medium text-[#98a1b2]">
                                <Archive className="size-2.5" />
                                Archiviert
                              </span>
                            )}
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
                            {archived ? (
                              <>
                                <Archive className="size-2.5" />
                                <span>Archiviert</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="size-2.5" />
                                <span>Next</span>
                              </>
                            )}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#a3aabd]">
                            {archived
                              ? subscription.archivedAt
                                ? formatDateLabel(subscription.archivedAt)
                                : "—"
                              : formatDateLabel(subscription.nextDueDate)}
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
  categories,
  onView,
  onArchive,
  onDelete,
}: {
  subscription: Subscription;
  fxRates: Record<string, number>;
  categories: Array<{ id: string; name: string; color: string }>;
  onView: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const REVEAL = 160;
  const isOpen = offsetX <= -(REVEAL / 2);

  const category = categories.find((c) => c.id === subscription.categoryId);
  const daysLeft = daysUntil(subscription.nextDueDate);
  const isUrgent = daysLeft <= 7;
  const eurCents =
    subscription.currency !== "EUR"
      ? toEurCents(subscription.amountCents, subscription.currency, fxRates)
      : null;

  // Close when another card opens
  useEffect(() => {
    function handleOtherOpen(e: Event) {
      if ((e as CustomEvent<{ id: string }>).detail.id !== subscription.id) setOffsetX(0);
    }
    window.addEventListener("swipe-card-open", handleOtherOpen);
    return () => window.removeEventListener("swipe-card-open", handleOtherOpen);
  }, [subscription.id]);

  // Close on touch outside when open
  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOffsetX(0);
    }
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => document.removeEventListener("touchstart", handleOutside);
  }, [isOpen]);

  return (
    <>
      <div ref={containerRef} className="relative overflow-hidden rounded-[16px]">
        {/* Archive + delete zone — only visible on swipe */}
        <div className="absolute inset-y-0 right-0 flex w-40 items-center rounded-r-[16px] overflow-hidden">
          <button
            type="button"
            aria-label={`Archive ${subscription.name}`}
            className="flex size-full flex-col items-center justify-center gap-1 bg-[#64748b] text-[10px] font-medium text-white"
            onClick={() => { onArchive(); setOffsetX(0); }}
          >
            <Archive className="size-5" />
            Archiv
          </button>
          <button
            type="button"
            aria-label={`Delete ${subscription.name}`}
            className="flex size-full flex-col items-center justify-center gap-1 bg-[#ef4444] text-[10px] font-medium text-white"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-5" />
            Löschen
          </button>
        </div>

        {/* Sliding card */}
        <div
          className="relative z-10 flex items-center gap-3 rounded-[16px] px-4 py-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? undefined : "transform 0.25s ease",
            touchAction: "pan-y",
            minHeight: 68,
          }}
          onTouchStart={(e) => {
            startXRef.current = e.touches[0].clientX;
            startOffsetRef.current = offsetX;
            setIsDragging(true);
          }}
          onTouchMove={(e) => {
            const dx = e.touches[0].clientX - startXRef.current;
            setOffsetX(Math.min(0, Math.max(-REVEAL, startOffsetRef.current + dx)));
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            if (offsetX < -(REVEAL / 2)) {
              setOffsetX(-REVEAL);
              window.dispatchEvent(
                new CustomEvent("swipe-card-open", { detail: { id: subscription.id } }),
              );
            } else {
              setOffsetX(0);
            }
          }}
          onClick={() => {
            if (isOpen) { setOffsetX(0); return; }
            onView();
          }}
        >
          {/* App icon */}
          <BrandAvatar
            logoKey={subscription.logoKey}
            name={subscription.name}
            className="size-11 shrink-0 rounded-[10px]"
          />

          {/* Name + badge */}
          <div className="min-w-0 flex-1">
            <div
              className="text-[15px] font-semibold leading-snug"
              style={{ color: "var(--text)" }}
            >
              {subscription.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: "var(--sub)" }}>
                {formatCurrency(subscription.amountCents, subscription.currency)} ·{" "}
                {subscription.billingCycle === "monthly" ? "Monatlich" : subscription.billingCycle === "quarterly" ? "Quartalsweise" : "Jährlich"}
                {eurCents !== null && (
                  <span className="ml-1" style={{ opacity: 0.7 }}>
                    · {formatCurrency(eurCents, "EUR")}
                  </span>
                )}
              </span>
              {category && (
                <>
                  <span
                    className="size-[3px] rounded-full"
                    style={{ background: "var(--border)" }}
                  />
                  <span
                    className="rounded-[6px] px-1.5 py-px text-[11px] font-medium"
                    style={{
                      background: `${category.color}22`,
                      color: category.color,
                    }}
                  >
                    {category.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Next date */}
          <div className="shrink-0 text-right">
            <div className="text-[10px]" style={{ color: "var(--sub)" }}>
              Nächste
            </div>
            <div
              className="mt-0.5 text-[13px] font-semibold"
              style={{ color: isUrgent ? "#f97316" : "var(--text)" }}
            >
              {isUrgent && "⚡ "}
              {formatDateLabel(subscription.nextDueDate)}
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
            <DialogTitle>{subscription.name} entfernen?</DialogTitle>
            <DialogDescription>
              Löschen entfernt das Abo und seine Zahlungshistorie endgültig. Gekündigt?
              Dann lieber archivieren — dann bleibt die Historie erhalten.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setConfirming(false); setOffsetX(0); }}
            >
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              onClick={() => { onArchive(); setConfirming(false); setOffsetX(0); }}
            >
              <Archive className="size-3.5" />
              Archivieren
            </Button>
            <Button
              variant="destructive"
              onClick={() => { onDelete(); setConfirming(false); }}
            >
              Endgültig löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ArchivedRow({
  subscription,
  fxRates,
  onView,
  onRestore,
  onDelete,
}: {
  subscription: Subscription;
  fxRates: Record<string, number>;
  onView: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const eurCents =
    subscription.currency !== "EUR"
      ? toEurCents(subscription.amountCents, subscription.currency, fxRates)
      : null;

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-[16px] px-4 py-3"
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          minHeight: 68,
        }}
      >
        <button
          type="button"
          onClick={onView}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <BrandAvatar
            logoKey={subscription.logoKey}
            name={subscription.name}
            className="size-11 shrink-0 rounded-[10px] opacity-60 grayscale"
          />
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[15px] font-semibold leading-snug"
              style={{ color: "var(--sub)" }}
            >
              {subscription.name}
            </div>
            <div className="mt-1 text-[11px]" style={{ color: "var(--sub)", opacity: 0.8 }}>
              {formatCurrency(subscription.amountCents, subscription.currency)}
              {eurCents !== null && ` · ${formatCurrency(eurCents, "EUR")}`}
              {subscription.archivedAt
                ? ` · archiviert ${formatDateLabel(subscription.archivedAt)}`
                : " · archiviert"}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`${subscription.name} reaktivieren`}
            onClick={onRestore}
            className="sl-tap-target flex size-9 items-center justify-center rounded-[10px]"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <ArchiveRestore className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`${subscription.name} endgültig löschen`}
            onClick={() => setConfirming(true)}
            className="sl-tap-target flex size-9 items-center justify-center rounded-[10px]"
            style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => { if (!open) setConfirming(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subscription.name} endgültig löschen?</DialogTitle>
            <DialogDescription>
              Das Abo und seine komplette Zahlungshistorie werden entfernt. Das lässt sich
              nicht rückgängig machen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => { onDelete(); setConfirming(false); }}
            >
              Endgültig löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyArchiveHint({ desktop = false }: { desktop?: boolean }) {
  // The mobile screens run on the themed CSS tokens, the desktop grid on the card palette.
  const surface = desktop
    ? { background: "#ffffff", border: "1px dashed #e4e7ee" }
    : { background: "var(--surface)", border: "1px dashed var(--border)" };
  const titleColor = desktop ? "#4b5263" : "var(--text)";
  const subColor = desktop ? "#98a1b2" : "var(--sub)";

  return (
    <div className="rounded-[16px] px-5 py-8 text-center" style={surface}>
      <Archive className="mx-auto size-6" style={{ color: subColor, opacity: 0.6 }} />
      <div className="mt-3 text-[14px] font-semibold" style={{ color: titleColor }}>
        Noch nichts im Archiv
      </div>
      <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-snug" style={{ color: subColor }}>
        Gekündigte Abos hier ablegen: Sie verschwinden aus Summen, Liste und Kalender,
        die Zahlungshistorie bleibt aber erhalten.
      </p>
    </div>
  );
}

function formatDateLabel(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
