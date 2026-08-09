import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-slow rounded-lg bg-paper-sunk", className)}
      {...props}
    />
  );
}

export { Skeleton };
