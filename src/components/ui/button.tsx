import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e8cff]/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#111827] px-4 py-2.5 text-white shadow-[0_14px_32px_-22px_rgba(17,24,39,0.52)] hover:bg-[#1f2937]",
        secondary:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,254,0.96))] px-4 py-2.5 text-[#111827] ring-1 ring-[#e9edf3] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-[#fafbff]",
        ghost: "px-3 py-2 text-[#7e8597] hover:bg-[#f5f7fb] hover:text-[#111827]",
        destructive:
          "bg-[#ef4444] px-4 py-2.5 text-white shadow-[0_16px_40px_-24px_rgba(239,68,68,0.8)] hover:bg-[#dc2626]",
      },
      size: {
        default: "h-11",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-5",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
