"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  LayoutGrid,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(158,194,255,0.38),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(225,236,255,0.6),_transparent_26%),linear-gradient(180deg,_#f4f7fb_0%,_#eef2f8_48%,_#edf2f7_100%)] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/40 bg-white/35 px-6 pb-8 pt-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-12 items-center justify-center rounded-[20px] bg-[#111827] text-white shadow-[0_22px_48px_-28px_rgba(17,24,39,0.85)]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.32em] text-[#94a3b8]">
                Personal App
              </div>
              <div className="text-xl font-semibold tracking-[-0.04em]">Sublist</div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/70 bg-white/65 p-3 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.4)]">
            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-[#111827] text-white shadow-[0_26px_60px_-34px_rgba(17,24,39,0.7)]"
                        : "text-[#64748b] hover:bg-white/80 hover:text-[#111827]",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.38)]">
            <Badge className="w-fit bg-[#eff6ff] text-[#2563eb]">Synced locally</Badge>
            <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em]">
              Quiet, focused tracking.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              A private subscription workspace with local persistence, premium spacing,
              and no filler screens.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/40 bg-white/45 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[0.72rem] uppercase tracking-[0.28em] text-[#94a3b8]">
                  Subscription Tracker
                </div>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
            </div>
          </header>

          <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-white/70 bg-white/88 p-2 shadow-[0_28px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-[22px] px-3 py-2.5 text-[0.72rem] font-medium transition",
                  active ? "bg-[#111827] text-white" : "text-[#64748b]",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
