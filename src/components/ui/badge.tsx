import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/80 px-3 py-1 text-xs font-medium text-[#5b6477]",
        className,
      )}
      {...props}
    />
  );
}
