"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex rounded-2xl border border-white/80 bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-medium text-[#6b7280] transition data-[state=active]:bg-[#111827] data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}
