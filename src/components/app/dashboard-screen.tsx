"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { useAppData } from "@/components/providers/app-providers";
import { Card, CardContent } from "@/components/ui/card";
import { convertCurrency } from "@/lib/currencies";
import { daysUntil, formatCurrency, toMonthlyAmount } from "@/lib/utils";

export function DashboardScreen() {
  const { data, ready, fxRates } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptions = useMemo(
    () => data.subscriptions.filter((item) => item.status !== "archived"),
    [data.subscriptions],
  );
  const selectedId = searchParams.get("subscription") ?? undefined;

  const selectedSubscription = subscriptions.find((item) => item.id === selectedId);

  function selectSubscription(subscriptionId: string) {
    const nextParams = new URLSearchParams();
    nextParams.set("subscription", subscriptionId);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  function clearSelection() {
    router.replace(pathname, { scroll: false });
  }

  const defaultCurrency = data.settings.defaultCurrency;
  const totalDue = subscriptions.reduce(
    (sum, item) => sum + convertCurrency(item.amountCents, item.currency, defaultCurrency, fxRates),
    0,
  );
  const averagePerMonth = subscriptions.reduce(
    (sum, item) =>
      sum + convertCurrency(toMonthlyAmount(item.amountCents, item.billingCycle), item.currency, defaultCurrency, fxRates),
    0,
  );
  const launches = [...subscriptions]
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 6);
  const upcoming = launches.slice(0, 3);

  const categoryBreakdown = data.categories
    .map((category) => ({
      name: category.name,
      color: category.color,
      value: subscriptions
        .filter((subscription) => subscription.categoryId === category.id)
        .reduce(
          (sum, subscription) =>
            sum + convertCurrency(toMonthlyAmount(subscription.amountCents, subscription.billingCycle), subscription.currency, defaultCurrency, fxRates),
          0,
        ),
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  const paymentBreakdown = data.paymentMethods
    .map((method) => ({
      name: method.name,
      color: method.color,
      value: subscriptions
        .filter((subscription) => subscription.paymentMethodId === method.id)
        .reduce(
          (sum, subscription) =>
            sum + convertCurrency(toMonthlyAmount(subscription.amountCents, subscription.billingCycle), subscription.currency, defaultCurrency, fxRates),
          0,
        ),
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  const maxCategory = Math.max(...categoryBreakdown.map((item) => item.value), 1);
  const maxPayment = Math.max(...paymentBreakdown.map((item) => item.value), 1);
  const aiSpend = categoryBreakdown.find((item) => item.name === "AI")?.value ?? 0;

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
      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-sm px-5 pt-6">
          {/* Page title */}
          <div
            className="mb-5 text-[26px] font-bold tracking-[-0.8px]"
            style={{ color: "var(--text)" }}
          >
            Dashboard
          </div>

          {/* Donut hero card */}
          <div
            className="mb-4 rounded-[20px] p-5"
            style={{
              background: "var(--hero-tint, var(--surface))",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-5">
              <MobileDonutChart
                data={categoryBreakdown}
                total={averagePerMonth}
                currency={defaultCurrency}
              />
              {/* Legend */}
              <div className="min-w-0 flex-1 space-y-2">
                {categoryBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span style={{ color: "var(--sub)" }}>{item.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {Math.round((item.value / Math.max(averagePerMonth, 1)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div
              className="rounded-[16px] p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: "var(--sub)" }}>
                Active
              </div>
              <div
                className="mt-2 text-[24px] font-bold tracking-[-0.8px]"
                style={{ color: "var(--text)" }}
              >
                {subscriptions.length}
              </div>
              <div className="text-[11px]" style={{ color: "var(--sub)" }}>subscriptions</div>
            </div>
            <div
              className="rounded-[16px] p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: "var(--sub)" }}>
                Next
              </div>
              <div
                className="mt-2 text-[16px] font-bold tracking-[-0.5px]"
                style={{ color: launches[0] ? "var(--text)" : "var(--sub)" }}
              >
                {launches[0] ? format(parseISO(launches[0].nextDueDate), "MMM d") : "—"}
              </div>
              <div className="truncate text-[11px]" style={{ color: "var(--sub)" }}>
                {launches[0]?.name ?? "no upcoming"}
              </div>
            </div>
          </div>

          {/* Upcoming list */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>
              Upcoming
            </div>
            <a
              href="/subscriptions"
              className="text-[13px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              See all →
            </a>
          </div>
          <div
            className="rounded-[16px] overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {launches.slice(0, 4).map((subscription, index) => {
              const daysLeft = daysUntil(subscription.nextDueDate);
              const isUrgent = daysLeft <= 7;
              return (
                <button
                  type="button"
                  key={subscription.id}
                  onClick={() => selectSubscription(subscription.id)}
                  className="sl-tap-target flex w-full items-center gap-3 px-4 py-3 text-left"
                  style={{
                    background: "var(--surface)",
                    borderBottom: index < Math.min(launches.length, 4) - 1
                      ? "1px solid var(--border)"
                      : undefined,
                  }}
                >
                  <BrandAvatar
                    logoKey={subscription.logoKey}
                    name={subscription.name}
                    className="size-9 shrink-0 rounded-[9px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[14px] font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {subscription.name}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--sub)" }}>
                      {formatCurrency(subscription.amountCents, subscription.currency)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="text-[13px] font-semibold"
                      style={{ color: isUrgent ? "#f97316" : "var(--text)" }}
                    >
                      {isUrgent && "⚡ "}
                      {format(parseISO(subscription.nextDueDate), "MMM d")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1fr)_252px] gap-5 xl:grid-cols-[minmax(0,1fr)_264px]">
          <div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Total due"
              value={formatCurrency(totalDue, defaultCurrency)}
            />
            <MetricCard
              label="Average per month"
              value={formatCurrency(averagePerMonth, defaultCurrency)}
            />
            <MetricCard
              label="Upcoming renewals"
              value={formatCurrency(
                upcoming.reduce((sum, item) => sum + convertCurrency(item.amountCents, item.currency, defaultCurrency, fxRates), 0),
                defaultCurrency,
              )}
            />
          </div>

          <div className="mt-5">
              <div className="mb-3 text-[13px] font-semibold text-[#586072]">Smart launches</div>
              <div className="grid grid-cols-2 gap-4">
                {launches.map((subscription) => (
                  <button
                    type="button"
                    key={subscription.id}
                    onClick={() =>
                      selectedId === subscription.id
                        ? clearSelection()
                        : selectSubscription(subscription.id)
                    }
                    className="rounded-[22px] border border-[#edf0f5] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_100%)] px-4 py-4 text-left shadow-[0_12px_28px_-24px_rgba(15,23,42,0.16)] transition hover:border-[#dce7ff]"
                  >
                    <div className="flex items-start gap-3">
                      <BrandAvatar
                        logoKey={subscription.logoKey}
                        name={subscription.name}
                        className="size-12 rounded-[14px]"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-[#455063]">
                          {subscription.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#8b95a7]">
                          {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-[11px] text-[#9aa4b5]">
                      <span className="size-2.5 rounded-full bg-[#efaa64]" />
                      {format(parseISO(subscription.nextDueDate), "MMM d")}
                    </div>
                  </button>
                ))}
              </div>
          </div>

          <div className="mt-5 max-w-[540px]">
            <Card className="rounded-[22px]">
              <CardContent className="p-4">
                <div className="mb-3 text-[13px] font-semibold text-[#596276]">
                  Upcoming this month
                </div>
                <div className="mb-4 flex gap-8 text-[10px] text-[#b1b8c5]">
                  {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div className="relative mb-4 h-2 rounded-full bg-[#edf1f6]">
                  <div className="absolute left-0 top-0 h-2 w-[32%] rounded-full bg-[#b8d2ff]" />
                </div>
                <div className="grid grid-cols-3 gap-5 text-[12px]">
                  {upcoming.map((subscription) => (
                    <button
                      type="button"
                      key={subscription.id}
                      onClick={() => selectSubscription(subscription.id)}
                      className="text-left"
                    >
                      <div className="font-semibold text-[#4d5567]">{subscription.name}</div>
                      <div className="mt-0.5 text-[#9ca3af]">
                        {format(parseISO(subscription.nextDueDate), "MMM d")}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          </div>

          <div className="space-y-4">
            {selectedSubscription ? (
              <SubscriptionDetail
                subscriptionId={selectedSubscription.id}
                onEdit={() => undefined}
                onClose={clearSelection}
              />
            ) : (
              <>
                <Card className="rounded-[24px]">
                  <CardContent className="p-4">
                    <div className="mb-3 text-[13px] font-semibold text-[#596276]">
                      Smart insights
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-[#fff2eb] text-[#f59a68]">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="text-[13px] leading-6 text-[#6b7383]">
                        <span className="font-semibold text-[#465062]">
                          You spend {formatCurrency(aiSpend, defaultCurrency)}
                        </span>
                        <br />
                        monthly on AI tools.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {categoryBreakdown.length > 0 && (
                  <DonutCard
                    title="By category"
                    items={categoryBreakdown}
                    currency={defaultCurrency}
                  />
                )}

                <BreakdownCard
                  title="Category breakdown"
                  items={categoryBreakdown.map((item) => ({
                    ...item,
                    width: `${Math.max(20, Math.round((item.value / maxCategory) * 100))}%`,
                  }))}
                  currency={defaultCurrency}
                />

                <BreakdownCard
                  title="Payment methods"
                  items={paymentBreakdown.map((item) => ({
                    ...item,
                    width: `${Math.max(20, Math.round((item.value / maxPayment) * 100))}%`,
                  }))}
                  currency={defaultCurrency}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[22px]">
      <CardContent className="px-6 py-6">
        <div className="text-[12px] text-[#9aa5b8]">{label}</div>
        <div className="mt-5 text-[21px] font-semibold tracking-[-0.05em] text-[#455063]">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function DonutCard({
  title,
  items,
  currency,
}: {
  title: string;
  items: Array<{ name: string; value: number; color: string }>;
  currency: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="rounded-[24px]">
      <CardContent className="p-4">
        <div className="mb-3 text-[13px] font-semibold text-[#596276]">{title}</div>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <ResponsiveContainer width={96} height={96}>
              <PieChart>
                <Pie
                  data={items}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {items.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0), currency)}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {items.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-[#728093]">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="ml-2 shrink-0 font-medium text-[#596276]">
                  {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileDonutChart({
  data,
  total,
  currency,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
  currency: string;
}) {
  const SIZE = 148;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE * 0.365; // ~54
  const strokeWidth = SIZE * 0.12; // ~18
  const circumference = 2 * Math.PI * r;
  const GAP = 3;

  let cumulativeAngle = -90;

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ overflow: "visible" }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.05)"
        />
        {data.map((segment) => {
          const segProportion = segment.value / Math.max(total, 1);
          const dashLength = Math.max(0, segProportion * circumference - GAP);
          const angle = cumulativeAngle;
          cumulativeAngle += segProportion * 360;
          return (
            <circle
              key={segment.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={strokeWidth}
              stroke={segment.color}
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${circumference}`}
              transform={`rotate(${angle}, ${cx}, ${cy})`}
            />
          );
        })}
      </svg>
      {/* Center label */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
      >
        <div
          className="text-[18px] font-bold leading-tight"
          style={{ color: "var(--text)", letterSpacing: "-0.8px" }}
        >
          {formatCurrency(total, currency)}
        </div>
        <div className="text-[11px]" style={{ color: "var(--sub)" }}>
          / mo
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
  currency,
}: {
  title: string;
  items: Array<{ name: string; value: number; color: string; width: string }>;
  currency: string;
}) {
  return (
    <Card className="rounded-[24px]">
      <CardContent className="p-4">
        <div className="mb-3 text-[13px] font-semibold text-[#596276]">{title}</div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#728093]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span>{formatCurrency(item.value, currency)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#ebeff5]">
                <div
                  className="h-2.5 rounded-full"
                  style={{ width: item.width, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
