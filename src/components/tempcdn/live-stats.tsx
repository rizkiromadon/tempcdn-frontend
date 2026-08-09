"use client";

import { useEffect, useState } from "react";
import { UploadCloud, HardDrive, AlertTriangle } from "lucide-react";
import { getTempCdnMetrics, type TempCdnMetrics } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

const POLL_INTERVAL_MS = 15000;

export function LiveStats() {
  const [metrics, setMetrics] = useState<TempCdnMetrics | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await getTempCdnMetrics();
        if (!cancelled) {
          setMetrics(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl border border-line bg-paper p-5 text-sm text-ink-faint">
        Live stats unavailable.
      </div>
    );
  }

  const stats = [
    {
      icon: UploadCloud,
      label: "uploads processed",
      value: metrics ? metrics.uploadsTotal.toLocaleString() : "—"
    },
    {
      icon: HardDrive,
      label: "bytes transferred",
      value: metrics ? formatBytes(metrics.uploadBytesTotal) : "—"
    },
    {
      icon: AlertTriangle,
      label: "upload errors",
      value: metrics ? metrics.uploadErrorsTotal.toLocaleString() : "—"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-line bg-paper p-5 shadow-soft">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-bloom-soft">
            <stat.icon className="h-4 w-4 text-bloom-strong" strokeWidth={1.75} />
          </div>
          <div className="mb-1 font-display text-xl font-bold text-ink">{stat.value}</div>
          <p className="text-xs text-ink-soft">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
