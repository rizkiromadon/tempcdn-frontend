"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "checking" | "online" | "offline";

export function StatusPill() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await checkHealth();
        if (!cancelled) setStatus(res.status === "ok" ? "online" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    poll();
    const interval = setInterval(poll, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dotColor =
    status === "online" ? "bg-signal" : status === "offline" ? "bg-rust" : "bg-bone-faint";

  const label =
    status === "online" ? "origin online" : status === "offline" ? "origin unreachable" : "checking";

  return (
    <div className="flex items-center gap-2 border border-steel-dim bg-surface-raised px-3 py-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor, status === "online" && "animate-pulse-slow")} />
      <span className="font-mono text-[10px] uppercase tracking-widest text-bone-dim">
        {label}
      </span>
    </div>
  );
}
