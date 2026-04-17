"use client";

import { useMemo, useState } from "react";
import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowUpRight, BellRing, CalendarClock, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { useAppData } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toMonthlyAmount } from "@/lib/utils";

const chartPalette = ["#4f46e5", "#0ea5e9", "#10b981", "#f97316", "#e11d48"];

export function DashboardScreen() {
  const { data, ready } = useAppData();
  const activeSubscriptions = useMemo(
    () => data.subscriptions.filter((item) => item.status !== "archived"),
    [data.subscriptions],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    activeSubscriptions[0]?.id,
  );
  const effectiveSelectedId = activeSubscriptions.find((item) => item.id === selectedId)
    ? selectedId
    : activeSubscriptions[0]?.id;

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const dueThisMonth = activeSubscriptions.filter((subscription) =>
    isWithinInterval(parseISO(subscription.nextDueDate), { start: monthStart, end: monthEnd }),
  );

  const monthlyAverage = activeSubscriptions.reduce(
    (total, subscription) =>
      total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
    0,
  );

  const categoryData = data.categories
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
    .filter((item) => item.value > 0);

  const paymentMethodData = data.paymentMethods
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
    .filter((item) => item.value > 0);

  const monthlySpendData = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(new Date(), 5 - index);
    const label = format(date, "MMM");
    const total = data.paymentHistory
      .filter((entry) => format(parseISO(entry.date), "yyyy-MM") === format(date, "yyyy-MM"))
      .reduce((sum, entry) => sum + entry.amountCents, 0);

    return { label, total: total / 100 };
  });

  const upcomingRenewals = [...activeSubscriptions]
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 5);

  if (!ready) {
    return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-32 animate-pulse bg-white/50" />)}</div>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            label="Total due this month"
            value={formatCurrency(
              dueThisMonth.reduce((total, subscription) => total + subscription.amountCents, 0),
              data.settings.defaultCurrency,
            )}
            meta={`${dueThisMonth.length} renewal${dueThisMonth.length === 1 ? "" : "s"}`}
            icon={<Wallet className="size-4" />}
          />
          <MetricCard
            label="Average per month"
            value={formatCurrency(monthlyAverage, data.settings.defaultCurrency)}
            meta="Normalized across billing cycles"
            icon={<ArrowUpRight className="size-4" />}
          />
          <MetricCard
            label="Upcoming renewals"
            value={String(upcomingRenewals.length)}
            meta="Next 5 tracked renewals"
            icon={<BellRing className="size-4" />}
          />
          <MetricCard
            label="Next due"
            value={
              upcomingRenewals[0]
                ? format(parseISO(upcomingRenewals[0].nextDueDate), "MMM d")
                : "None"
            }
            meta={upcomingRenewals[0]?.name ?? "No active subscriptions"}
            icon={<CalendarClock className="size-4" />}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Spending over time</CardTitle>
              <CardDescription>Last six months of recorded payments.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpendData}>
                  <defs>
                    <linearGradient id="spend" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.7)",
                      boxShadow: "0 20px 60px -36px rgba(15,23,42,0.4)",
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} fill="url(#spend)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming this month</CardTitle>
              <CardDescription>Closest renewal dates across active subscriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueThisMonth.length === 0 ? (
                <div className="rounded-[24px] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                  No renewals left this month.
                </div>
              ) : (
                dueThisMonth
                  .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
                  .map((subscription) => (
                    <button
                      key={subscription.id}
                      type="button"
                      onClick={() => setSelectedId(subscription.id)}
                      className="flex w-full items-center gap-4 rounded-[24px] bg-[#f8fafc] p-4 text-left transition hover:bg-white"
                    >
                      <BrandAvatar
                        logoKey={subscription.logoKey}
                        name={subscription.name}
                        className="size-14"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{subscription.name}</div>
                        <div className="text-sm text-[#64748b]">
                          {format(parseISO(subscription.nextDueDate), "EEE, MMM d")}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(subscription.amountCents, subscription.currency)}
                      </div>
                    </button>
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Category breakdown</CardTitle>
              <CardDescription>Monthly-equivalent spend by subscription type.</CardDescription>
            </CardHeader>
            <CardContent className="grid h-[290px] gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="h-[220px] xl:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" innerRadius={54} outerRadius={84} paddingAngle={3}>
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color || chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-[22px] bg-[#f8fafc] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-medium">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(entry.value, data.settings.defaultCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment method breakdown</CardTitle>
              <CardDescription>How recurring spend maps to cards and accounts.</CardDescription>
            </CardHeader>
            <CardContent className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" hide />
                  <Tooltip />
                  <Bar dataKey="value" radius={[16, 16, 16, 16]}>
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid gap-3">
                {paymentMethodData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-[22px] bg-[#f8fafc] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                      />
                      <span className="text-sm font-medium">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(entry.value, data.settings.defaultCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#64748b]">Focused detail</div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">
              Live subscription view
            </div>
          </div>
          <Badge className="bg-white/80">Local only</Badge>
        </div>
        <SubscriptionDetail subscriptionId={effectiveSelectedId} onEdit={() => undefined} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <Badge className="bg-[#f8fafc] text-[#475569]">{label}</Badge>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#4f46e5]">
            {icon}
          </div>
        </div>
        <div className="mt-5 text-3xl font-semibold tracking-[-0.06em]">{value}</div>
        <p className="mt-2 text-sm text-[#64748b]">{meta}</p>
      </CardContent>
    </Card>
  );
}
