import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-black/6 bg-white px-4 text-sm text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none ring-0 transition placeholder:text-[#9ca3af] focus:border-[#5e8cff] focus:ring-4 focus:ring-[#5e8cff]/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
