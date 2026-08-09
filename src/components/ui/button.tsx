import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-mono text-xs font-medium uppercase tracking-wider transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-hazard text-void hover:bg-hazard-glow shadow-rivet",
        secondary:
          "bg-surface-raised text-bone border border-steel hover:border-hazard hover:text-hazard",
        ghost: "text-bone-dim hover:text-bone hover:bg-surface-raised",
        danger: "bg-rust-dim text-bone hover:bg-rust border border-rust-dim",
        outline: "border border-steel text-bone hover:border-bone bg-transparent"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10"
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
