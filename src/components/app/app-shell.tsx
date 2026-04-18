"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  LayoutGrid,
  Lock,
  Settings2,
} from "lucide-react";

import { useAppData } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data } = useAppData();
  const categories = new Map(data.categories.map((item) => [item.id, item]));
  const sidebarSubscriptions = data.subscriptions
    .filter((item) => item.status !== "archived")
    .slice(0, 8);
  const desktopNavigation = navigation.filter((item) => item.href !== "/settings");
  function subscriptionHref(subscriptionId: string) {
    if (pathname === "/") {
      return `/?subscription=${subscriptionId}`;
    }

    if (pathname === "/subscriptions") {
      return `/subscriptions?subscription=${subscriptionId}`;
    }

    return `/subscriptions?subscription=${subscriptionId}`;
  }

  return (
    <div className="min-h-screen bg-[#f5f4f7] text-[#111827]">
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.98),rgba(244,244,247,0.96)_48%,#eceff4_100%)]">
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_50%_100%,rgba(202,211,223,0.38),rgba(245,244,247,0)_68%)]" />
        <div className="mx-auto flex min-h-screen max-w-[1260px] flex-col px-3 py-4 sm:px-5 sm:py-6">
          <div className="relative flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px] border border-[#e8ebf0] bg-[linear-gradient(180deg,rgba(251,251,253,0.96)_0%,rgba(245,247,251,0.98)_100%)] shadow-[0_38px_100px_-72px_rgba(15,23,42,0.26)] lg:grid lg:grid-cols-[198px_minmax(0,1fr)]">
            <aside className="hidden border-r border-[#eceef3] bg-[linear-gradient(180deg,#efeff3_0%,#f3f4f8_100%)] px-4 pb-5 pt-5 lg:flex lg:flex-col">
              <div className="mb-7 flex items-center gap-2 pl-1">
                <div className="h-3 w-3 rounded-full bg-[#e68b7c]" />
                <div className="h-3 w-3 rounded-full bg-[#ebc46e]" />
                <div className="h-3 w-3 rounded-full bg-[#8ec883]" />
              </div>

              <div className="rounded-[14px] bg-[#f3f5f9] p-2">
                <nav className="space-y-1">
                  {desktopNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-[11px] px-3 py-3 text-[12px] font-medium transition",
                          active
                            ? "bg-[#dce8fb] text-[#4f77b8]"
                            : "text-[#7c8494] hover:bg-white hover:text-[#111827]",
                        )}
                      >
                        <Icon className="size-3.5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-7 border-t border-[#e3e5eb] px-2 pt-5">
                <div className="text-[11px] font-medium text-[#b0b6c4]">Subscriptions</div>
                <div className="mt-2 space-y-1">
                  {sidebarSubscriptions.map((subscription) => (
                    <Link
                      key={subscription.id}
                      href={subscriptionHref(subscription.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-[12px] px-2 py-2.5 text-[11px]",
                        "text-[#687183] hover:bg-white/80 hover:text-[#4a5467]",
                      )}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            categories.get(subscription.categoryId)?.color ?? "#7c8aa5",
                        }}
                      />
                      <span className="truncate">{subscription.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-auto border-t border-[#e3e5eb] px-2 pt-4">
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-2 py-2 text-[11px] font-medium transition",
                    pathname === "/settings"
                      ? "bg-white/90 text-[#4f77b8]"
                      : "text-[#7c8494] hover:bg-white hover:text-[#111827]",
                  )}
                >
                  <Settings2 className="size-3.5" />
                  Settings
                </Link>
              </div>
            </aside>

            <div className="min-w-0">
              <header className="sticky top-0 z-30 hidden border-b border-[#eceef3] bg-white/76 px-4 py-4 backdrop-blur-xl sm:px-5 lg:block lg:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[17px] font-semibold tracking-[-0.05em] text-[#3f4656] lg:text-[18px]">
                      {title}
                    </h1>
                    <p className="mt-0.5 hidden max-w-xl text-[10px] leading-4 text-[#b0b6c4] md:block xl:hidden">
                      {description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {actions ? <div className="hidden items-center gap-3 md:flex">{actions}</div> : null}
                    <div className="flex size-8 items-center justify-center rounded-full border border-[#e7e9ef] bg-[#fafbfe] text-[#98a1b2] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                      <Lock className="size-3.5" />
                    </div>
                  </div>
                </div>
              </header>

              <main className="px-3 pb-24 pt-3 sm:px-5 lg:px-7 lg:pb-6">{children}</main>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
        <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-[22px] border border-[#edf0f5] bg-white/96 px-1.5 py-1.5 shadow-[0_18px_46px_-30px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[9px] font-medium transition",
                  active ? "text-[#5e95ff]" : "text-[#b5bcc9]",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
