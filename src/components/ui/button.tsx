import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e8cff]/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#111827] px-4 py-2.5 text-white shadow-[0_16px_40px_-24px_rgba(17,24,39,0.75)] hover:bg-[#1f2937]",
        secondary:
          "bg-white/80 px-4 py-2.5 text-[#111827] ring-1 ring-black/6 hover:bg-white",
        ghost: "px-3 py-2 text-[#5b6477] hover:bg-white/75 hover:text-[#111827]",
        destructive:
          "bg-[#ef4444] px-4 py-2.5 text-white shadow-[0_16px_40px_-24px_rgba(239,68,68,0.8)] hover:bg-[#dc2626]",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-xl px-3 text-sm",
        lg: "h-12 rounded-2xl px-5",
        icon: "size-10 rounded-2xl",
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
