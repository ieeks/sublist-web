import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-[14px] border border-[#edf0f5] bg-white px-3.5 text-[13px] text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none ring-0 transition placeholder:text-[#a8afbd] focus:border-[#cfe0ff] focus:ring-4 focus:ring-[#5e8cff]/8",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
