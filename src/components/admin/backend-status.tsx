"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { checkHealth, getApiBases } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type ConnectionState = "checking" | "online" | "offline";

const POLL_INTERVAL_MS = 15000;

/**
 * Shows whether the backend is currently reachable (via GET /healthz,
 * through the same round-robin + failover machinery as every other read),
 * plus how many backend bases are currently known/online. Polled
 * periodically so the badge reflects reality without requiring a manual
 * refresh.
 */
export function BackendStatus() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [baseCount, setBaseCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        await checkHealth();
        const bases = await getApiBases();
        if (!cancelled) {
          setState("online");
          setBaseCount(bases.length);
        }
      } catch {
        if (!cancelled) setState("offline");
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <Server className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
        Backend connection
      </div>
      {state === "checking" ? (
        <Skeleton className="h-5 w-16 rounded-full" />
      ) : state === "online" ? (
        <Badge variant="active">
          Online{baseCount !== null ? ` · ${baseCount} node${baseCount === 1 ? "" : "s"}` : ""}
        </Badge>
      ) : (
        <Badge variant="danger">Unreachable</Badge>
      )}
    </div>
  );
}
