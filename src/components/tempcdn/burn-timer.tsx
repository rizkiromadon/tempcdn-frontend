"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { cn, formatCountdown, fractionRemaining, msUntil } from "@/lib/utils";

interface BurnTimerProps {
  expiresAt: string;
  createdAt: string;
  className?: string;
  /** "gauge" for the radial hero timer, "bar" for the compact linear variant */
  variant?: "gauge" | "bar";
}

function useBurnState(expiresAt: string, createdAt: string) {
  const [remaining, setRemaining] = useState(() => msUntil(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntil(expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const fraction = fractionRemaining(createdAt, expiresAt);
  const isExpired = remaining <= 0;
  const isCritical = !isExpired && fraction < 0.15;
  const isWarning = !isExpired && fraction < 0.4;

  const tone = isExpired || isCritical ? "text-rust-glow" : isWarning ? "text-hazard" : "text-signal";
  const strokeColor = isExpired || isCritical ? "#E06B52" : isWarning ? "#F4A226" : "#4F9D6E";
  const barTone = isExpired || isCritical ? "bg-rust" : isWarning ? "bg-hazard" : "bg-signal";

  return { remaining, fraction, isExpired, isCritical, isWarning, tone, strokeColor, barTone };
}

export function BurnTimer({ expiresAt, createdAt, className, variant = "bar" }: BurnTimerProps) {
  const { remaining, fraction, isExpired, isCritical, tone, strokeColor, barTone } = useBurnState(
    expiresAt,
    createdAt
  );

  if (variant === "gauge") {
    const size = 96;
    const stroke = 6;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - fraction);

    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#26292B"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="square"
              className={cn(
                "transition-[stroke-dashoffset] duration-1000 ease-linear",
                isCritical && !isExpired && "animate-pulse-slow"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Flame className={cn("h-4 w-4", tone, isCritical && !isExpired && "animate-pulse-slow")} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-faint">
            burn timer
          </p>
          <p className={cn("font-mono text-lg font-semibold tabular-nums", tone)}>
            {formatCountdown(remaining)}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-bone-faint">
            {isExpired ? "purged" : `${Math.round(fraction * 100)}% of ttl left`}
          </p>
        </div>
      </div>
    );
  }

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
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
