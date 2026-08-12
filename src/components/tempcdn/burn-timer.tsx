"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn, formatCountdown, fractionRemaining, msUntil } from "@/lib/utils";

interface BurnTimerProps {
  expiresAt: string;
  createdAt: string;
  className?: string;
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

  const tone = isExpired || isCritical ? "text-coral" : isWarning ? "text-amber" : "text-bloom-strong";
  const strokeColor = isExpired || isCritical ? "#F1685E" : isWarning ? "#F3A455" : "#6366F1";
  const barTone = isExpired || isCritical ? "bg-coral" : isWarning ? "bg-amber" : "bg-bloom";

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
              stroke="#EEF0F8"
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
              strokeLinecap="round"
              className={cn(
                "transition-[stroke-dashoffset] duration-1000 ease-linear",
                isCritical && !isExpired && "animate-breathe"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock className={cn("h-4 w-4", tone, isCritical && !isExpired && "animate-breathe")} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-ink-faint">time left</p>
          <p className={cn("font-display text-lg font-semibold tabular-nums", tone)}>
            {formatCountdown(remaining)}
          </p>
          <p className="text-xs text-ink-faint">
            {isExpired ? "expired" : `${Math.round(fraction * 100)}% remaining`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-faint">time left</span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            tone,
            isCritical && !isExpired && "animate-breathe"
          )}
        >
          {formatCountdown(remaining)}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-linear", barTone)}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}

