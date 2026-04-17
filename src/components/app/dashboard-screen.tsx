"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CreditCard, Sparkles } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { useAppData } from "@/components/providers/app-providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toMonthlyAmount } from "@/lib/utils";

export function DashboardScreen() {
  const { data, ready } = useAppData();
  const activeSubscriptions = useMemo(
    () => data.subscriptions.filter((item) => item.status !== "archived"),
    [data.subscriptions],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    activeSubscriptions[1]?.id ?? activeSubscriptions[0]?.id,
  );
  const effectiveSelectedId = activeSubscriptions.find((item) => item.id === selectedId)
    ? selectedId
    : activeSubscriptions[0]?.id;

  const totalDue = activeSubscriptions.reduce(
    (total, subscription) => total + subscription.amountCents,
    0,
  );
  const averagePerMonth = activeSubscriptions.reduce(
    (total, subscription) =>
      total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
    0,
  );
  const upcomingRenewals = [...activeSubscriptions]
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 6);

  const aiSpend = activeSubscriptions
    .filter((subscription) => subscription.categoryId === "ai")
    .reduce(
      (total, subscription) =>
        total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
      0,
    );

  const categoryBreakdown = data.categories
    .map((category) => ({
      name: category.name,
      short: category.name.length > 13 ? `${category.name.slice(0, 13)}…` : category.name,
      value: activeSubscriptions
        .filter((subscription) => subscription.categoryId === category.id)
        .reduce(
          (total, subscription) =>
            total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
          0,
        ),
      color: category.color,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const paymentBreakdown = data.paymentMethods
    .map((method) => ({
      name: method.name,
      short: method.name.length > 13 ? `${method.name.slice(0, 13)}…` : method.name,
      value: activeSubscriptions
        .filter((subscription) => subscription.paymentMethodId === method.id)
        .reduce(
          (total, subscription) =>
            total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
          0,
        ),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const maxCategory = Math.max(...categoryBreakdown.map((item) => item.value), 1);
  const maxPayment = Math.max(...paymentBreakdown.map((item) => item.value), 1);

  if (!ready) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-28 animate-pulse bg-white/80" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_214px_230px]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Total due" value={formatCurrency(totalDue, data.settings.defaultCurrency)} />
          <MetricCard
            label="Average per month"
            value={formatCurrency(averagePerMonth, data.settings.defaultCurrency)}
          />
          <MetricCard
            label="Upcoming renewals"
            value={formatCurrency(
              upcomingRenewals.reduce((total, subscription) => total + subscription.amountCents, 0),
              data.settings.defaultCurrency,
            )}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] text-[#6b7280]">Smart launches</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {upcomingRenewals.map((subscription) => (
                <button
                  type="button"
                  key={subscription.id}
                  onClick={() => setSelectedId(subscription.id)}
                  className="rounded-[14px] border border-[#eff2f6] bg-[#fbfcff] p-3 text-left transition hover:border-[#d8e7ff] hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <BrandAvatar
                      logoKey={subscription.logoKey}
                      name={subscription.name}
                      className="size-10 rounded-[12px]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-[#4b5263]">
                        {subscription.name}
                      </div>
                      <div className="text-[11px] text-[#9ca3af]">
                        {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#9ca3af]">
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#ff9f6e]" />
                      {format(parseISO(subscription.nextDueDate), "MMM d")}
                    </span>
                    <span className="capitalize">{subscription.status}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] text-[#6b7280]">Upcoming this month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[11px] text-[#a4abbb]">
                {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative h-2 rounded-full bg-[#edf1f6]">
                <div className="absolute left-[4%] top-0 h-2 w-[35%] rounded-full bg-[#b8d2ff]" />
              </div>
              <div className="space-y-2">
                {upcomingRenewals.slice(0, 3).map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between rounded-[14px] bg-[#fbfcff] px-3 py-2.5"
                  >
                    <div>
                      <div className="text-[12px] font-semibold text-[#4b5263]">
                        {subscription.name}
                      </div>
                      <div className="text-[11px] text-[#9ca3af]">
                        {format(parseISO(subscription.nextDueDate), "MMM d")}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-[#596174]">
                      {formatCurrency(subscription.amountCents, subscription.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="self-start">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] text-[#6b7280]">Smart insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[16px] bg-[#fbfcff] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-[#fff1eb] text-[#ff8d60]">
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-5 text-[#4b5263]">
                  You spend {formatCurrency(aiSpend, data.settings.defaultCurrency)} monthly on AI tools.
                </div>
              </div>
            </div>
          </div>

          <InsightGroup
            title="Category breakdown"
            items={categoryBreakdown.map((item) => ({
              label: item.short,
              value: item.value,
              accent: item.color,
              max: maxCategory,
            }))}
          />

          <InsightGroup
            title="Payment methods"
            items={paymentBreakdown.map((item) => ({
              label: item.short,
              value: item.value,
              accent: "#7b8ddf",
              max: maxPayment,
            }))}
            icon={<CreditCard className="size-3.5" />}
          />
        </CardContent>
      </Card>

      <div className="xl:-ml-5 xl:pt-6">
        <SubscriptionDetail subscriptionId={effectiveSelectedId} onEdit={() => undefined} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] text-[#a2a9b9]">{label}</div>
        <div className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-[#4b5263]">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightGroup({
  title,
  items,
  icon,
}: {
  title: string;
  items: Array<{ label: string; value: number; accent: string; max: number }>;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#667085]">
        {icon}
        {title}
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#7d8596]">
              <span>{item.label}</span>
              <span>{formatCurrency(item.value, "EUR")}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#eef2f7]">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.max((item.value / item.max) * 100, 14)}%`,
                  backgroundColor: item.accent,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
