"use client";

import { useEffect, useState } from "react";
import { Files, HardDrive, UploadCloud, AlertTriangle, Server } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/components/admin/admin-guard";
import { getTempCdnStats, getNodes, checkHealth, TempCdnError, type TempCdnStats } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import type { NodesResponse, NodeInfo } from "@/types/tempcdn";

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  error
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
  error: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-20" />
          ) : error ? (
            <p className="mt-0.5 text-sm text-coral">Unavailable</p>
          ) : (
            <p className="mt-0.5 truncate font-display text-xl font-bold text-ink">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewContent() {
  const [stats, setStats] = useState<LoadState<TempCdnStats>>({ status: "loading" });
  const [nodes, setNodes] = useState<LoadState<NodesResponse>>({ status: "loading" });
  const [health, setHealth] = useState<LoadState<{ status: string }>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getTempCdnStats()
      .then((data) => !cancelled && setStats({ status: "ready", data }))
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof TempCdnError ? err.message : "Failed to load stats";
        setStats({ status: "error", message });
      });

    getNodes()
      .then((data) => !cancelled && setNodes({ status: "ready", data }))
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof TempCdnError ? err.message : "Failed to load nodes";
        setNodes({ status: "error", message });
      });

    checkHealth()
      .then((data) => !cancelled && setHealth({ status: "ready", data }))
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof TempCdnError ? err.message : "Failed to reach backend";
        setHealth({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onlineNodeCount =
    nodes.status === "ready"
      ? nodes.data.nodes.filter((n: NodeInfo) => n.status === "online").length
      : 0;
  const totalNodeCount = nodes.status === "ready" ? nodes.data.nodes.length : 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Overview</h1>
          <p className="mt-1 text-sm text-ink-soft">A quick summary of the TempCDN backend.</p>
        </div>
        {health.status === "ready" ? (
          <Badge variant="active">Backend online</Badge>
        ) : health.status === "error" ? (
          <Badge variant="danger">Backend unreachable</Badge>
        ) : (
          <Skeleton className="h-5 w-24 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active files"
          value={stats.status === "ready" ? stats.data.activeFileCount.toLocaleString() : ""}
          icon={Files}
          loading={stats.status === "loading"}
          error={stats.status === "error"}
        />
        <StatCard
          label="Storage used"
          value={stats.status === "ready" ? formatBytes(stats.data.activeBytes) : ""}
          icon={HardDrive}
          loading={stats.status === "loading"}
          error={stats.status === "error"}
        />
        <StatCard
          label="Lifetime uploads"
          value={stats.status === "ready" ? stats.data.uploadsTotal.toLocaleString() : ""}
          icon={UploadCloud}
          loading={stats.status === "loading"}
          error={stats.status === "error"}
        />
        <StatCard
          label="Upload errors"
          value={stats.status === "ready" ? stats.data.uploadErrorsTotal.toLocaleString() : ""}
          icon={AlertTriangle}
          loading={stats.status === "loading"}
          error={stats.status === "error"}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Content types
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.status === "loading" ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : stats.status === "error" ? (
              <p className="text-sm text-ink-faint">Couldn&apos;t load content type breakdown.</p>
            ) : Object.keys(stats.data.contentTypeBreakdown).length === 0 ? (
              <p className="text-sm text-ink-faint">No active files yet.</p>
            ) : (
              (Object.entries(stats.data.contentTypeBreakdown) as [string, number][])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([contentType, count]) => (
                  <div key={contentType} className="flex items-center justify-between text-sm">
                    <span className="truncate font-mono text-xs text-ink-soft">{contentType}</span>
                    <span className="font-medium text-ink">{count.toLocaleString()}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Cluster nodes
            </span>
            <Server className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
          </CardHeader>
          <CardContent className="space-y-3">
            {nodes.status === "loading" ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </>
            ) : nodes.status === "error" ? (
              <p className="text-sm text-ink-faint">Couldn&apos;t load node list.</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">Online</span>
                  <span className="font-medium text-ink">
                    {onlineNodeCount} / {totalNodeCount}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {nodes.data.nodes.map((node: NodeInfo) => (
                    <div key={node.node_id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-ink-soft">{node.node_id}</span>
                      <Badge variant={node.status === "online" ? "active" : "danger"} className="capitalize">
                        {node.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.status === "ready" && stats.data.generatedAt && (
        <p className="mt-6 text-center text-xs text-ink-faint">
          Stats generated at {formatDate(stats.data.generatedAt)}
        </p>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <AdminGuard>
      {() =>
        <OverviewContent />
      }
    </AdminGuard>
  );
}
