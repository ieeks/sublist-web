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
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
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
  const sidebarSubscriptions = data.subscriptions.slice(0, 8);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.96),_rgba(243,244,248,0.92)_55%,_#eef1f6_100%)] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-[1140px] flex-col px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-[#ebeef4] bg-[linear-gradient(180deg,#fafbfd_0%,#f5f7fb_100%)] shadow-[0_38px_110px_-72px_rgba(15,23,42,0.26)] lg:grid lg:grid-cols-[198px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#edf0f5] bg-[linear-gradient(180deg,#f9fafc_0%,#f4f6fa_100%)] px-4 pb-5 pt-5 lg:flex lg:flex-col">
          <div className="px-2">
            <div className="text-[11px] font-semibold tracking-[-0.02em] text-[#495062]">Sublist</div>
          </div>

          <div className="mt-4 rounded-[14px] bg-[#f3f5f9] p-2">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[11px] font-medium transition",
                      active
                        ? "bg-[#d8e7ff] text-[#3b82f6]"
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

          <div className="mt-5 px-2">
            <div className="text-[11px] font-medium text-[#b0b6c4]">Subscriptions</div>
            <div className="mt-2 space-y-0.5">
              {sidebarSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between rounded-[10px] px-2 py-2 text-[11px] text-[#687183]"
                >
                  <span className="truncate">{subscription.name}</span>
                  <span className="text-[#c0c5d0]">••</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto px-2 pt-4">
            <div className="flex items-center gap-2 text-[11px] text-[#a3acbc]">
              <span className="size-1.5 rounded-full bg-[#9cd58c]" />
              Personal tracker
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[#edf0f5] bg-white/88 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.05em] text-[#4b5263] lg:text-[18px]">{title}</h1>
                <p className="mt-0.5 hidden max-w-xl text-[10px] leading-4 text-[#b0b6c4] md:block xl:hidden">
                  {description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {actions ? <div className="hidden items-center gap-3 md:flex">{actions}</div> : null}
                <div className="flex size-8 items-center justify-center rounded-full border border-[#edf0f5] bg-[#fafbfe] text-[#98a1b2]">
                  <Lock className="size-3.5" />
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 pb-24 pt-3 sm:px-5 lg:px-6 lg:pb-6">{children}</main>
        </div>
      </div>
      </div>

      <div className="fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
        <div className="mx-auto flex max-w-sm items-center justify-between rounded-[18px] border border-[#edf0f5] bg-white px-1.5 py-1.5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.22)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[10px] font-medium transition",
                  active ? "bg-[#eef4ff] text-[#3b82f6]" : "text-[#8891a3]",
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
