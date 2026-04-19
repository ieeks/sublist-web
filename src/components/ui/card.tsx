import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[#eef0f5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,250,253,0.96))] shadow-[0_18px_44px_-30px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.88)] dark:border-[rgba(148,163,184,0.18)] dark:bg-[rgba(15,23,42,0.72)] dark:shadow-[0_18px_44px_-30px_rgba(2,8,23,0.5)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[15px] font-semibold tracking-[-0.03em] text-[#111827]", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[#99a0b0]", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4", className)} {...props} />;
}
