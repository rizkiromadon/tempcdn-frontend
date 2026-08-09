import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "bg-bloom text-white shadow-soft hover:bg-bloom-strong hover:shadow-lifted",
        secondary:
          "bg-paper text-ink border border-line hover:border-bloom/40 hover:bg-bloom-soft/60",
        ghost: "text-ink-soft hover:text-ink hover:bg-paper-sunk",
        danger: "bg-coral-soft text-coral hover:bg-coral hover:text-white",
        outline: "border border-line text-ink bg-transparent hover:border-ink-faint"
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 rounded-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
