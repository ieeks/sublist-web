"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-[14px] border border-[#edf0f5] bg-white px-3.5 text-[13px] text-[#111827] outline-none transition focus:border-[#cfe0ff] focus:ring-4 focus:ring-[#5e8cff]/8 dark:border-[rgba(148,163,184,0.2)] dark:bg-[rgba(15,23,42,0.82)] dark:text-[#f8fafc]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 text-[#6b7280] dark:text-[#94a3b8]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "z-50 overflow-hidden rounded-[18px] border border-[#eef1f6] bg-white p-1.5 shadow-[0_22px_60px_-34px_rgba(15,23,42,0.22)] dark:border-[rgba(148,163,184,0.18)] dark:bg-[rgba(11,18,32,0.97)]",
          className,
        )}
        position="popper"
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-[12px] py-2.5 pl-9 pr-3.5 text-[13px] text-[#111827] outline-none transition focus:bg-[#f8faff] focus:text-[#111827] dark:text-[#f0f4ff] dark:focus:bg-[rgba(30,41,59,0.8)] dark:focus:text-[#f8fafc] dark:data-[state=checked]:text-[#f8fafc]",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 inline-flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-[#5e8cff]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
