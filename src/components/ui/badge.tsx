import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#edf0f5] bg-[#fbfcff] px-2.5 py-1 text-[11px] font-medium text-[#7e8597]",
        className,
      )}
      {...props}
    />
  );
}
