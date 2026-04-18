"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { SubscriptionDetail } from "@/components/app/subscription-detail";
import { useAppData } from "@/components/providers/app-providers";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, toMonthlyAmount } from "@/lib/utils";

export function DashboardScreen() {
  const { data, ready } = useAppData();
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

  const totalDue = subscriptions.reduce((sum, item) => sum + item.amountCents, 0);
  const averagePerMonth = subscriptions.reduce(
    (sum, item) => sum + toMonthlyAmount(item.amountCents, item.billingCycle),
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
            sum + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
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
            sum + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
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
      <div className="space-y-3 lg:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] text-[#acb3c1]">Total due</div>
            <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-[#4b5263]">
              {formatCurrency(totalDue, data.settings.defaultCurrency)}
            </div>
            <div className="mt-1 text-[11px] text-[#9ca3af]">
              {formatCurrency(averagePerMonth, data.settings.defaultCurrency)} average monthly
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {launches.slice(0, 4).map((subscription) => (
            <button
              type="button"
              key={subscription.id}
              onClick={() => selectSubscription(subscription.id)}
              className="block w-full text-left"
            >
              <Card>
                <CardContent className="flex items-center gap-3 p-3">
                  <BrandAvatar
                    logoKey={subscription.logoKey}
                    name={subscription.name}
                    className="size-10 rounded-[12px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-[#4d5567]">
                      {subscription.name}
                    </div>
                    <div className="text-[10px] text-[#9ca3af]">
                      {formatCurrency(subscription.amountCents, subscription.currency)} · /mo
                    </div>
                  </div>
                  <div className="text-[12px] text-[#96a0b2]">
                    {format(parseISO(subscription.nextDueDate), "MMM d")}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1fr)_252px] gap-5 xl:grid-cols-[minmax(0,1fr)_264px]">
          <div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Total due"
              value={formatCurrency(totalDue, data.settings.defaultCurrency)}
            />
            <MetricCard
              label="Average per month"
              value={formatCurrency(averagePerMonth, data.settings.defaultCurrency)}
            />
            <MetricCard
              label="Upcoming renewals"
              value={formatCurrency(
                upcoming.reduce((sum, item) => sum + item.amountCents, 0),
                data.settings.defaultCurrency,
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
                          You spend {formatCurrency(aiSpend, data.settings.defaultCurrency)}
                        </span>
                        <br />
                        monthly on AI tools.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <BreakdownCard
                  title="Category breakdown"
                  items={categoryBreakdown.map((item) => ({
                    ...item,
                    width: `${Math.max(20, Math.round((item.value / maxCategory) * 100))}%`,
                  }))}
                  currency={data.settings.defaultCurrency}
                />

                <BreakdownCard
                  title="Payment methods"
                  items={paymentBreakdown.map((item) => ({
                    ...item,
                    width: `${Math.max(20, Math.round((item.value / maxPayment) * 100))}%`,
                  }))}
                  currency={data.settings.defaultCurrency}
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
