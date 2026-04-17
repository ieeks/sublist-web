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

  const selected = activeSubscriptions.find((item) => item.id === selectedId)
    ? selectedId
    : activeSubscriptions[1]?.id ?? activeSubscriptions[0]?.id;

  const totalDue = activeSubscriptions.reduce((sum, item) => sum + item.amountCents, 0);
  const averagePerMonth = activeSubscriptions.reduce(
    (sum, item) => sum + toMonthlyAmount(item.amountCents, item.billingCycle),
    0,
  );
  const upcomingRenewals = [...activeSubscriptions]
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 6);
  const selectedSubscription = activeSubscriptions.find((item) => item.id === selected);
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
    <>
    <div className="space-y-3 lg:hidden">
      <Card>
        <CardContent className="p-4">
          <div className="text-[11px] text-[#acb3c1]">Dashboard</div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-[#4b5263]">
            {formatCurrency(totalDue, data.settings.defaultCurrency)}
          </div>
          <div className="mt-1 text-[11px] text-[#9ca3af]">
            {upcomingRenewals.length} active renewals tracked
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {upcomingRenewals.slice(0, 4).map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <BrandAvatar
                logoKey={subscription.logoKey}
                name={subscription.name}
                className="size-10 rounded-[12px]"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#4d5567]">{subscription.name}</div>
                <div className="text-[10px] text-[#9ca3af]">
                  {format(parseISO(subscription.nextDueDate), "MMM d")}
                </div>
              </div>
              <div className="text-[12px] font-semibold text-[#5a6274]">
                {formatCurrency(subscription.amountCents, subscription.currency)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    <div className="relative hidden lg:block">
      <div className="pr-[250px] xl:pr-[270px]">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.04em] text-[#4b5263]">
            Dashboard
          </h2>
        </div>

        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_210px] gap-4">
          <MetricCard label="Total due" value={formatCurrency(totalDue, data.settings.defaultCurrency)} />
          <MetricCard
            label="Average per month"
            value={formatCurrency(averagePerMonth, data.settings.defaultCurrency)}
          />
          <MetricCard
            label="Upcoming renewals"
            value={formatCurrency(
              upcomingRenewals.slice(0, 2).reduce((sum, item) => sum + item.amountCents, 0),
              data.settings.defaultCurrency,
            )}
          />

          <Card className="row-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] text-[#5e6678]">Smart insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[18px] bg-[#fcfcfe] p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-[#fff1eb] text-[#ff9569]">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div className="text-[12px] font-semibold leading-5 text-[#51596b]">
                    You spend {formatCurrency(aiSpend, data.settings.defaultCurrency)} monthly on AI tools.
                  </div>
                </div>
              </div>

              <InsightGroup
                title="Category breakdown"
                items={categoryBreakdown.map((item) => ({
                  label: item.name,
                  value: item.value,
                  color: item.color,
                  max: maxCategory,
                }))}
              />

              <InsightGroup
                title="Payment methods"
                icon={<CreditCard className="size-3.5" />}
                items={paymentBreakdown.map((item) => ({
                  label: item.name,
                  value: item.value,
                  color: "#6f83df",
                  max: maxPayment,
                }))}
              />
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] text-[#5e6678]">Smart launches</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {upcomingRenewals.map((subscription) => (
                <button
                  type="button"
                  key={subscription.id}
                  onClick={() => setSelectedId(subscription.id)}
                  className="rounded-[18px] border border-[#eff2f6] bg-[#fcfcfe] p-3 text-left transition hover:border-[#d8e7ff] hover:bg-white"
                >
                  <div className="flex items-start gap-2.5">
                    <BrandAvatar
                      logoKey={subscription.logoKey}
                      name={subscription.name}
                      className="size-9 rounded-[12px]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-[#4d5567]">
                        {subscription.name}
                      </div>
                      <div className="text-[10px] text-[#9ca3af]">
                        {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[10px] text-[#a3acbb]">
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#ff9b70]" />
                      {format(parseISO(subscription.nextDueDate), "MMM d")}
                    </span>
                    <span>Active</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] text-[#5e6678]">Upcoming this month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-[10px] text-[#afb6c4]">
                {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative h-2 rounded-full bg-[#eef1f6]">
                <div className="absolute left-[4%] top-0 h-2 w-[36%] rounded-full bg-[#bdd5ff]" />
              </div>
              <div className="space-y-3">
                {upcomingRenewals.slice(0, 3).map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between rounded-[16px] bg-[#fcfcfe] px-3 py-3"
                  >
                    <div>
                      <div className="text-[12px] font-semibold text-[#4d5567]">
                        {subscription.name}
                      </div>
                      <div className="text-[10px] text-[#9ca3af]">
                        {format(parseISO(subscription.nextDueDate), "MMM d")}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-[#5a6274]">
                      {formatCurrency(subscription.amountCents, subscription.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 top-10 w-[246px] xl:right-[-8px] xl:w-[258px]">
        <div className="pointer-events-auto">
          <SubscriptionDetail
            subscriptionId={selected}
            onEdit={() => undefined}
          />
        </div>
      </div>

      {!selectedSubscription ? null : (
        <div className="lg:hidden">{selectedSubscription.name}</div>
      )}
    </div>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] text-[#acb3c1]">{label}</div>
        <div className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-[#4b5263]">
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
  items: Array<{ label: string; value: number; color: string; max: number }>;
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
            <div className="flex items-center justify-between text-[10px] text-[#7f8797]">
              <span>{item.label}</span>
              <span>{formatCurrency(item.value, "EUR")}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#eef2f7]">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.max((item.value / item.max) * 100, 16)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
