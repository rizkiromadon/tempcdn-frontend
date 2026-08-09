import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest",
  {
    variants: {
      variant: {
        neutral: "border-steel text-bone-dim bg-surface-raised",
        active: "border-signal/40 text-signal bg-signal/10",
        warning: "border-hazard/40 text-hazard bg-hazard/10",
        danger: "border-rust/40 text-rust-glow bg-rust/10"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
