"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { useAppData } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { advanceDate, formatCurrency } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getOccurrencesForMonth(subscription: Subscription, anchorDate: Date) {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  let cursor = parseISO(subscription.startDate);
  const dates: string[] = [];

  while (cursor <= monthEnd) {
    if (cursor >= monthStart) {
      dates.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = advanceDate(cursor, subscription.billingCycle);
  }

  return dates;
}

export function CalendarScreen() {
  const { data } = useAppData();
  const [month, setMonth] = useState(new Date());

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    calendarDays.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const dueItems = useMemo(
    () =>
      data.subscriptions
        .filter((subscription) => subscription.status !== "archived")
        .flatMap((subscription) =>
          getOccurrencesForMonth(subscription, month).map((date) => ({
            subscription,
            date,
          })),
        )
        .sort((left, right) => left.date.localeCompare(right.date)),
    [data.subscriptions, month],
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Monthly overview</CardTitle>
            <CardDescription>
              Renewal indicators generated from each billing cycle.
            </CardDescription>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Button
              variant="secondary"
              size="icon"
              className="size-10 sm:size-9"
              onClick={() => setMonth((current) => addDays(startOfMonth(current), -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Badge className="bg-white px-3 py-1 text-sm sm:text-xs">{format(month, "MMMM yyyy")}</Badge>
            <Button
              variant="secondary"
              size="icon"
              className="size-10 sm:size-9"
              onClick={() => setMonth((current) => addDays(endOfMonth(current), 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-[#94a3b8] sm:mb-4 sm:gap-2 sm:text-xs sm:tracking-[0.22em]">
            {weekdayLabels.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const items = dueItems.filter((item) => item.date === dayKey);
              return (
                <div
                  key={dayKey}
                  className={[
                    "min-h-[88px] rounded-[16px] border p-2 transition sm:min-h-[118px] sm:rounded-[24px] sm:p-3",
                    isSameMonth(day, month)
                      ? "border-white/80 bg-white/82 dark:border-[rgba(148,163,184,0.1)] dark:bg-[rgba(15,23,42,0.55)]"
                      : "border-white/50 bg-white/40 text-[#94a3b8] dark:border-[rgba(148,163,184,0.06)] dark:bg-[rgba(15,23,42,0.25)]",
                    isToday(day) ? "ring-2 ring-[#5e8cff]/30" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{format(day, "d")}</div>
                    {items.length > 0 ? (
                      <Badge className="bg-[#eff6ff] px-2 py-0.5 text-[10px] text-[#2563eb] sm:px-2.5 sm:py-1 sm:text-xs">
                        {items.length}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2">
                    {items.slice(0, 3).map((item) => (
                      <BrandAvatar
                        key={`${item.subscription.id}-${item.date}`}
                        logoKey={item.subscription.logoKey}
                        name={item.subscription.name}
                        className="size-5 rounded-[5px] sm:size-6 sm:rounded-[6px]"
                        compact
                      />
                    ))}
                    {items.length > 3 ? (
                      <div className="flex size-5 items-center justify-center rounded-[5px] bg-[#f0f4ff] text-[8px] font-semibold text-[#6b7280] sm:size-6 sm:rounded-[6px] sm:text-[9px]">
                        +{items.length - 3}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Renewal list</CardTitle>
            <CardDescription>All occurrences for the selected month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueItems.length === 0 ? (
              <div className="rounded-[24px] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                No renewals in this month.
              </div>
            ) : (
              dueItems.map((item) => (
                <div
                  key={`${item.subscription.id}-${item.date}`}
                  className="flex items-center gap-4 rounded-[24px] bg-[#f8fafc] p-4"
                >
                  <BrandAvatar
                    logoKey={item.subscription.logoKey}
                    name={item.subscription.name}
                    className="size-14"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.subscription.name}</div>
                    <div className="text-sm text-[#64748b]">{format(parseISO(item.date), "EEEE, MMM d")}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(item.subscription.amountCents, item.subscription.currency)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
