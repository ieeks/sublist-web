"use client";

import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CreditCard,
  Ellipsis,
  LayoutGrid,
  Lock,
  PauseCircle,
  Pencil,
  Plus,
  Settings2,
  Share2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAppData } from "@/components/providers/app-providers";
import { cn, formatCurrency, summarizeTotalSpent, toMonthlyAmount } from "@/lib/utils";

const assetBase = process.env.NODE_ENV === "production" ? "/sublist-web" : "";

const logoMap: Record<string, string> = {
  chatgpt: `${assetBase}/assets/logos/chatgpt.svg`,
  claude: `${assetBase}/assets/logos/claude.svg`,
  netflix: `${assetBase}/assets/logos/netflix.svg`,
  "icloud-plus": `${assetBase}/assets/logos/icloud-plus.svg`,
  perplexity: `${assetBase}/assets/logos/perplexity.svg`,
  "google-ai-pro": `${assetBase}/assets/logos/google-ai-pro.svg`,
  digitalocean: `${assetBase}/assets/logos/digitalocean.svg`,
  "github-copilot": `${assetBase}/assets/logos/github-copilot.svg`,
  "apple-tv-plus": `${assetBase}/assets/logos/apple-tv-plus.svg`,
};

const desktopNav = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
] as const;

const mobileTabs = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "List", href: "/subscriptions", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings2 },
  { label: "Manage", href: "/subscriptions", icon: Ellipsis },
] as const;

function SceneBadge({
  kind,
  name,
  mobile = false,
}: {
  kind: string;
  name: string;
  mobile?: boolean;
}) {
  const size = mobile ? "h-11 w-11 rounded-[14px]" : "h-12 w-12 rounded-[14px]";
  const src = logoMap[kind];

  if (src) {
    return (
      <div
        className={`${size} relative overflow-hidden border border-[#f0f2f6] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04)]`}
      >
        <Image src={src} alt={name} fill sizes="48px" className="object-contain p-2.5" />
      </div>
    );
  }

  return (
    <div
      className={`${size} grid place-items-center bg-white text-[12px] font-semibold text-[#5b7cff] shadow-[0_2px_6px_rgba(15,23,42,0.04)]`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function percentWidth(value: number, max: number) {
  if (max <= 0) return "24%";
  return `${Math.max(24, Math.round((value / max) * 100))}%`;
}

export function MockupScene() {
  const { data, ready, updateSubscriptionStatus } = useAppData();
  const [selectedId, setSelectedId] = useState("claude");
  const [shareState, setShareState] = useState<"share" | "copied">("share");

  const subscriptions = useMemo(
    () => data.subscriptions.filter((item) => item.status !== "archived"),
    [data.subscriptions],
  );

  const selectedSubscription =
    subscriptions.find((item) => item.id === selectedId) ??
    subscriptions.find((item) => item.id === "claude") ??
    subscriptions[0];

  const totalDue = subscriptions.reduce((sum, item) => sum + item.amountCents, 0);
  const averagePerMonth = subscriptions.reduce(
    (sum, item) => sum + toMonthlyAmount(item.amountCents, item.billingCycle),
    0,
  );

  const smartTiles = [...subscriptions]
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 6);
  const mobileList = smartTiles.slice(0, 5);
  const sidebarSubscriptions = subscriptions.slice(0, 9);
  const upcomingThisMonth = smartTiles.slice(0, 3);

  const categoryMap = new Map(data.categories.map((item) => [item.id, item]));
  const paymentMethodMap = new Map(data.paymentMethods.map((item) => [item.id, item]));

  const categoryBreakdown = data.categories
    .map((category) => ({
      name: category.name,
      value: subscriptions
        .filter((subscription) => subscription.categoryId === category.id)
        .reduce(
          (total, subscription) =>
            total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
          0,
        ),
      color: category.color,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  const paymentBreakdown = data.paymentMethods
    .map((method) => ({
      name: method.name,
      value: subscriptions
        .filter((subscription) => subscription.paymentMethodId === method.id)
        .reduce(
          (total, subscription) =>
            total + toMonthlyAmount(subscription.amountCents, subscription.billingCycle),
          0,
        ),
      color: method.color,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  const categoryMax = Math.max(...categoryBreakdown.map((item) => item.value), 1);
  const paymentMax = Math.max(...paymentBreakdown.map((item) => item.value), 1);

  const paymentHistory = selectedSubscription
    ? data.paymentHistory
        .filter((item) => item.subscriptionId === selectedSubscription.id)
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 3)
    : [];

  const selectedCategory = selectedSubscription
    ? categoryMap.get(selectedSubscription.categoryId)
    : undefined;
  const selectedPaymentMethod = selectedSubscription
    ? paymentMethodMap.get(selectedSubscription.paymentMethodId)
    : undefined;
  const totalSpent = selectedSubscription
    ? summarizeTotalSpent(selectedSubscription.id, data.paymentHistory)
    : 0;

  async function handleShare() {
    if (!selectedSubscription) return;

    const text = `${selectedSubscription.name} · ${formatCurrency(
      selectedSubscription.amountCents,
      selectedSubscription.currency,
    )} · due ${format(parseISO(selectedSubscription.nextDueDate), "MMM d")}`;

    if (navigator.share) {
      await navigator.share({ title: selectedSubscription.name, text });
      return;
    }

    await navigator.clipboard.writeText(text);
    setShareState("copied");
    window.setTimeout(() => setShareState("share"), 1800);
  }

  if (!ready || !selectedSubscription) {
    return <div className="min-h-screen bg-[#f5f4f7]" />;
  }

  return (
    <div className="min-h-screen overflow-x-auto overflow-y-hidden bg-[#f5f4f7] text-slate-800 antialiased">
      <div className="relative min-h-screen min-w-[1420px] bg-[radial-gradient(circle_at_50%_18%,#ffffff_0%,#f4f3f6_46%,#eceef2_100%)]">
        <div className="absolute inset-x-0 bottom-0 h-52 bg-[radial-gradient(circle_at_50%_100%,rgba(202,211,223,0.44),rgba(245,244,247,0)_68%)]" />
        <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(255,255,255,0.1)_35%,rgba(235,237,241,0.22)_100%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-8 py-12">
          <div className="relative h-[760px] w-[1420px]">
            <div className="absolute left-[42px] top-[312px] h-[514px] w-[270px] rounded-[42px] bg-[#15181d] shadow-[0_36px_70px_rgba(15,23,42,0.2)]">
              <div className="absolute inset-[5px] rounded-[37px] bg-[#f7f6f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                <div className="absolute left-1/2 top-[12px] h-[30px] w-[122px] -translate-x-1/2 rounded-full bg-[#0d0f13]" />
                <div className="px-5 pt-10">
                  <div className="mb-6 flex items-center justify-between text-[13px] font-semibold text-slate-700">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>◔</span>
                      <span>◔</span>
                      <span>▮</span>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-slate-700">
                      Subscriptions
                    </h2>
                    <Link
                      href="/subscriptions"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-[16px] text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.06)]"
                    >
                      <Plus className="size-4" />
                    </Link>
                  </div>

                  <div className="mb-3 flex items-center justify-between rounded-[12px] bg-[#f1f1f4] px-4 py-2.5 text-[11px] text-slate-400">
                    <span>Total due</span>
                    <span>{formatCurrency(totalDue, data.settings.defaultCurrency)}</span>
                  </div>

                  <div className="space-y-3">
                    {mobileList.map((item) => {
                      const selected = item.id === selectedSubscription.id;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className="block w-full text-left"
                        >
                          <div
                            className={cn(
                              "rounded-[16px] border bg-white px-3.5 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.03)] transition",
                              selected
                                ? "border-[#dbe6fb] shadow-[0_14px_32px_-24px_rgba(88,124,212,0.28)]"
                                : "border-[#efeff3]",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <SceneBadge kind={item.logoKey} name={item.name} mobile />
                                <div>
                                  <div className="text-[14px] font-semibold tracking-[-0.02em] text-slate-700">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {formatCurrency(item.amountCents, item.currency)} · /mo
                                  </div>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {format(parseISO(item.nextDueDate), "MMM d")}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-[#f7f7fa] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="grid grid-cols-5 text-center text-[9px] text-slate-400">
                    {mobileTabs.map((item) => {
                      const Icon = item.icon;
                      const active = item.href === "/";

                      return (
                        <Link key={item.label} href={item.href} className="space-y-1">
                          <Icon
                            className={`mx-auto size-4 ${active ? "text-[#59a5ff]" : "text-slate-300"}`}
                          />
                          <div className={active ? "text-[#59a5ff]" : ""}>{item.label}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-[356px] top-[150px] h-[594px] w-[930px] rounded-[28px] bg-[#20252d] shadow-[0_24px_42px_rgba(15,23,42,0.18)]">
              <div className="absolute inset-[9px] rounded-[19px] bg-[#f5f4f7]">
                <div className="grid h-full grid-cols-[178px_1fr] overflow-hidden rounded-[19px]">
                  <div className="border-r border-[#ecebf0] bg-[#efeff3] px-4 pb-4 pt-6">
                    <div className="mb-8 flex items-center gap-2 pl-1">
                      <div className="h-3 w-3 rounded-full bg-[#e68b7c]" />
                      <div className="h-3 w-3 rounded-full bg-[#ebc46e]" />
                      <div className="h-3 w-3 rounded-full bg-[#8ec883]" />
                    </div>

                    <div className="space-y-2 text-[13px]">
                      {desktopNav.map((item) => {
                        const Icon = item.icon;
                        const active = item.href === "/";

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-[10px] px-3 py-3 ${
                              active ? "bg-[#dce8fb] text-[#4f77b8]" : "text-slate-500"
                            }`}
                          >
                            <Icon className="size-4" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-7 space-y-1 border-t border-[#e3e3ea] pt-5 text-[13px] text-slate-500">
                      {sidebarSubscriptions.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition",
                            item.id === selectedSubscription.id && "bg-white/80 text-slate-700",
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{
                              backgroundColor:
                                categoryMap.get(item.categoryId)?.color ?? "#94a3b8",
                            }}
                          />
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-[#e3e3ea] pt-4 text-[13px] text-slate-500">
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5">
                        <Settings2 className="size-4 text-slate-400" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-6">
                    <div className="mb-4 flex items-center justify-between pr-2">
                      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                        Dashboard
                      </h1>
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-[#e7e6eb] bg-[#fafafd] text-slate-500">
                        <Lock className="size-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["Total due", formatCurrency(totalDue, data.settings.defaultCurrency)],
                        [
                          "Average per month",
                          formatCurrency(averagePerMonth, data.settings.defaultCurrency),
                        ],
                        [
                          "Upcoming renewals",
                          formatCurrency(
                            upcomingThisMonth.reduce((sum, item) => sum + item.amountCents, 0),
                            data.settings.defaultCurrency,
                          ),
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-[14px] bg-[#f7f6f9] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                        >
                          <div className="text-[12px] text-slate-400">{label}</div>
                          <div className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_226px] gap-4">
                      <div>
                        <div className="mb-2 text-[14px] font-semibold text-slate-600">
                          Smart launches
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {smartTiles.map((tile) => (
                            <button
                              type="button"
                              key={tile.id}
                              onClick={() => setSelectedId(tile.id)}
                              className="rounded-[14px] border border-[#f0eff4] bg-[#f8f7fa] px-4 py-4 text-left shadow-[0_2px_6px_rgba(15,23,42,0.02)] transition hover:border-[#dce6fb]"
                            >
                              <div className="flex items-center gap-3">
                                <SceneBadge kind={tile.logoKey} name={tile.name} />
                                <div className="min-w-0">
                                  <div className="truncate text-[14px] font-semibold text-slate-700">
                                    {tile.name}
                                  </div>
                                  <div className="text-[12px] text-slate-500">
                                    {formatCurrency(tile.amountCents, tile.currency)} · /mo
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center gap-2 text-[12px] text-slate-400">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#f2a35d]" />
                                <span>{format(parseISO(tile.nextDueDate), "MMM d")}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="mt-5 text-[14px] font-semibold text-slate-600">
                          Upcoming this month
                        </div>
                        <div className="mt-2 rounded-[14px] bg-[#f7f6f9] px-4 py-3">
                          <div className="mb-4 flex gap-8 text-[12px] text-slate-400">
                            {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month) => (
                              <span key={month}>{month}</span>
                            ))}
                          </div>
                          <div className="relative mb-3 h-[2px] bg-[#e7e7ee]">
                            <div className="absolute left-0 top-0 h-[2px] w-24 bg-[#7eb3f9]" />
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-[12px] text-slate-500">
                            {upcomingThisMonth.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className="text-left"
                              >
                                <div className="font-semibold text-slate-600">{item.name}</div>
                                <div>{format(parseISO(item.nextDueDate), "MMM d")}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-5">
                          <div className="mb-3 text-[14px] font-semibold text-slate-500">
                            Smart insights
                          </div>
                          <div className="text-[15px] leading-6 text-slate-500">
                            <span className="font-semibold text-slate-700">
                              You spend{" "}
                              {formatCurrency(
                                categoryBreakdown
                                  .filter((item) => item.name === "AI")
                                  .reduce((sum, item) => sum + item.value, 0),
                                data.settings.defaultCurrency,
                              )}
                            </span>
                            <br />
                            monthly on AI tools.
                          </div>
                        </div>

                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-4">
                          <div className="mb-3 text-[14px] font-semibold text-slate-600">
                            Category breakdown
                          </div>
                          <div className="space-y-3.5 text-[12px] text-slate-500">
                            {categoryBreakdown.map((item) => (
                              <div key={item.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span>{item.name}</span>
                                  </div>
                                  <span>
                                    {formatCurrency(item.value, data.settings.defaultCurrency)}
                                  </span>
                                </div>
                                <div className="h-2.5 rounded-full bg-[#e6edf7]">
                                  <div
                                    className="h-2.5 rounded-full"
                                    style={{
                                      width: percentWidth(item.value, categoryMax),
                                      backgroundColor: item.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-4">
                          <div className="mb-3 text-[14px] font-semibold text-slate-600">
                            Payment methods
                          </div>
                          <div className="space-y-3.5 text-[12px] text-slate-500">
                            {paymentBreakdown.map((item) => (
                              <div key={item.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span>{item.name}</span>
                                  </div>
                                  <span>
                                    {formatCurrency(item.value, data.settings.defaultCurrency)}
                                  </span>
                                </div>
                                <div className="h-2.5 rounded-full bg-[#e6edf7]">
                                  <div
                                    className="h-2.5 rounded-full"
                                    style={{
                                      width: percentWidth(item.value, paymentMax),
                                      backgroundColor: item.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[-8px] left-[36px] right-[36px] h-[14px] rounded-b-[20px] bg-[#cfd1d9] opacity-90 blur-[1px]" />
              <div className="absolute bottom-[-16px] left-[18px] right-[18px] h-[20px] rounded-[0_0_24px_24px] bg-[#d6d8df] opacity-75 blur-[1px]" />
              <div className="absolute bottom-[-50px] left-[80px] right-[80px] h-[34px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(170,180,194,0.34),rgba(170,180,194,0)_72%)] blur-[8px]" />
            </div>

            <div className="absolute right-[52px] top-[236px] w-[270px] rounded-[28px] border border-white/80 bg-[#f7f6f8]/96 px-5 pb-4 pt-5 shadow-[0_22px_56px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <div className="mb-4 flex justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-[#fff4ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <Image
                    src={logoMap[selectedSubscription.logoKey] ?? logoMap.claude}
                    alt={selectedSubscription.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                </div>
              </div>
              <div className="mb-4 text-center text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                {selectedSubscription.name}
              </div>

              <div className="mb-5 flex items-center justify-center gap-6 text-[12px] text-slate-500">
                <Link href="/subscriptions" className="flex items-center gap-1.5">
                  <Pencil className="size-3.5 text-slate-400" />
                  <span>Edit</span>
                </Link>
                <button type="button" onClick={handleShare} className="flex items-center gap-1.5">
                  <Share2 className="size-3.5 text-slate-400" />
                  <span>{shareState === "copied" ? "Copied" : "Share"}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSubscriptionStatus(
                      selectedSubscription.id,
                      selectedSubscription.status === "paused" ? "active" : "paused",
                    )
                  }
                  className="flex items-center gap-1.5"
                >
                  <PauseCircle className="size-3.5 text-slate-400" />
                  <span>{selectedSubscription.status === "paused" ? "Resume" : "Suspend"}</span>
                </button>
              </div>

              <div className="space-y-0 text-[13px] text-slate-500">
                {[
                  [
                    "Amount",
                    formatCurrency(selectedSubscription.amountCents, selectedSubscription.currency),
                  ],
                  ["Category", selectedCategory?.name ?? "Unknown"],
                  ["Payment method", selectedPaymentMethod?.name ?? "Unknown"],
                  ["Rewards", selectedSubscription.rewards || "None"],
                  ["Start date", format(parseISO(selectedSubscription.startDate), "MMM d, yyyy")],
                  ["Next due", format(parseISO(selectedSubscription.nextDueDate), "MMM d")],
                  ["Total spent", formatCurrency(totalSpent, selectedSubscription.currency)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-t border-[#ecebf0] py-3 first:border-t-0"
                  >
                    <span>{label}</span>
                    <span className="text-slate-600">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[#ecebf0] pt-4">
                <div className="mb-3 text-[14px] font-semibold text-slate-600">
                  Payment History
                </div>
                <div className="space-y-2.5 text-[13px] text-slate-500">
                  {paymentHistory.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-[12px] bg-[#f3f2f6] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              [selectedPaymentMethod?.color ?? "#58a7ff", "#a36bff", "#f58cb0"][
                                index % 3
                              ],
                          }}
                        />
                        <span>{selectedPaymentMethod?.name ?? "Payment"}</span>
                      </div>
                      <span className="text-slate-600">
                        {formatCurrency(item.amountCents, item.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
