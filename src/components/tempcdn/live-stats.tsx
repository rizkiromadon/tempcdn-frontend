"use client";

import { useEffect, useState } from "react";
import { UploadCloud, HardDrive, AlertTriangle, Files, Gauge, ShieldCheck } from "lucide-react";
import { getTempCdnStats, type TempCdnStats } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const POLL_INTERVAL_MS = 15000;

function errorRate(stats: TempCdnStats): number {
  const attempts = stats.uploadsTotal + stats.uploadErrorsTotal;
  if (attempts === 0) return 0;
  return (stats.uploadErrorsTotal / attempts) * 100;
}

function topContentTypes(stats: TempCdnStats, limit = 4) {
  return Object.entries(stats.contentTypeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function LiveStats() {
  const [metrics, setMetrics] = useState<TempCdnStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await getTempCdnStats();
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
        Live stats unavailable right now — the network is still doing its job either way.
      </div>
    );
  }

  const loading = !metrics;
  const rate = metrics ? errorRate(metrics) : 0;
  const successRate = metrics ? 100 - rate : 100;
  const breakdown = metrics ? topContentTypes(metrics) : [];
  const totalBreakdown = breakdown.reduce((sum, [, count]) => sum + count, 0) || 1;

  const primaryStats = [
    {
      icon: Files,
      label: "files in transit right now",
      value: metrics ? metrics.activeFileCount.toLocaleString() : null,
      accent: "bloom" as const
    },
    {
      icon: UploadCloud,
      label: "uploads processed, all time",
      value: metrics ? metrics.uploadsTotal.toLocaleString() : null,
      accent: "sage" as const
    },
    {
      icon: HardDrive,
      label: "currently stored",
      value: metrics ? formatBytes(metrics.activeBytes) : null,
      accent: "amber" as const
    },
    {
      icon: Gauge,
      label: "lifetime data moved",
      value: metrics ? formatBytes(metrics.uploadBytesTotal) : null,
      accent: "bloom" as const
    },
    {
      icon: ShieldCheck,
      label: "upload success rate",
      value: metrics ? `${successRate.toFixed(1)}%` : null,
      accent: "sage" as const
    },
    {
      icon: AlertTriangle,
      label: "upload errors, all time",
      value: metrics ? metrics.uploadErrorsTotal.toLocaleString() : null,
      accent: "coral" as const
    }
  ];

  const accentText: Record<string, string> = {
    bloom: "text-bloom-strong bg-bloom-soft",
    sage: "text-sage bg-sage-soft",
    amber: "text-amber bg-amber-soft",
    coral: "text-coral bg-coral-soft"
  };

  const breakdownColors = ["bg-bloom", "bg-sage", "bg-amber", "bg-coral"];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {primaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-paper p-5 shadow-soft"
          >
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${accentText[stat.accent]}`}
            >
              <stat.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            {stat.value ? (
              <div className="mb-1 animate-count-in font-display text-2xl font-bold tabular-nums text-ink">
                {stat.value}
              </div>
            ) : (
              <Skeleton className="mb-1.5 h-7 w-20" />
            )}
            <p className="text-xs text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5 shadow-soft">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Average file size
          </h3>
          {metrics ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tabular-nums text-ink">
                {formatBytes(metrics.averageFileBytes)}
              </span>
              <span className="text-xs text-ink-soft">per upload, across the whole network</span>
            </div>
          ) : (
            <Skeleton className="h-7 w-32" />
          )}
        </div>

        <div className="rounded-xl border border-line bg-paper p-5 shadow-soft">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            What&apos;s passing through
          </h3>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : breakdown.length > 0 ? (
            <div className="space-y-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-paper-sunk">
                {breakdown.map(([type, count], i) => (
                  <span
                    key={type}
                    className={breakdownColors[i % breakdownColors.length]}
                    style={{ width: `${(count / totalBreakdown) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                {breakdown.map(([type, count], i) => (
                  <li key={type} className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${breakdownColors[i % breakdownColors.length]}`}
                    />
                    <span className="font-mono">{type}</span>
                    <span className="text-ink-faint">
                      {((count / totalBreakdown) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-ink-faint">Not enough uploads yet to break down.</p>
          )}
        </div>
      </div>
    </div>
  );
}
