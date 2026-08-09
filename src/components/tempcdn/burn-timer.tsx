"use client";

import { useEffect, useState } from "react";
import { cn, formatCountdown, msUntil } from "@/lib/utils";

interface BurnTimerProps {
  expiresAt: string;
  createdAt: string;
  className?: string;
}

export function BurnTimer({ expiresAt, createdAt, className }: BurnTimerProps) {
  const [remaining, setRemaining] = useState(() => msUntil(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntil(expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const total = new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  const fractionLeft = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const isExpired = remaining <= 0;
  const isCritical = !isExpired && fractionLeft < 0.15;
  const isWarning = !isExpired && fractionLeft < 0.4;

  const tone = isExpired
    ? "text-rust-glow"
    : isCritical
    ? "text-rust-glow"
    : isWarning
    ? "text-hazard"
    : "text-signal";

  const barTone = isExpired || isCritical ? "bg-rust" : isWarning ? "bg-hazard" : "bg-signal";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-bone-faint">
          burn timer
        </span>
        <span
          className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            tone,
            isCritical && !isExpired && "animate-pulse-slow"
          )}
        >
          {formatCountdown(remaining)}
        </span>
      </div>
      <div className="relative h-1 w-full overflow-hidden bg-steel-dim">
        <div
          className={cn("h-full transition-all duration-1000 ease-linear", barTone)}
          style={{ width: `${fractionLeft * 100}%` }}
        />
      </div>
    </div>
  );
}
