"use client";

import { useEffect, useState } from "react";
import {
  Files,
  HardDrive,
  UploadCloud,
  AlertTriangle,
  Server,
  ShieldCheck,
  Clock
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/components/admin/admin-guard";
import { getTempCdnStats, getNodes, checkHealth, TempCdnError, type TempCdnStats } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import type { NodesResponse, NodeInfo, AdminSession } from "@/types/tempcdn";

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
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bloom-soft text-bloom-strong">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-16" />
          ) : error ? (
            <p className="mt-0.5 text-sm text-coral">Unavailable</p>
          ) : (
            <p className="mt-0.5 truncate font-display text-lg font-bold leading-tight text-ink">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children
}: {
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {title}
        </span>
        {action}
      </CardHeader>
      <CardContent className="flex-1 p-0">{children}</CardContent>
    </Card>
  );
}

function Row({
  left,
  right,
  mono
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0">
      <span className={mono ? "truncate font-mono text-xs text-ink-soft" : "text-ink-soft"}>
        {left}
      </span>
      <span className="shrink-0 font-medium text-ink">{right}</span>
    </div>
  );
}

function DashboardContent({ session }: { session: AdminSession }) {
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
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      {/* Header bar: page title + account + backend status, all in one row */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-sage" strokeWidth={1.75} />
            Signed in as <span className="font-mono text-ink">{session.username}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {health.status === "ready" ? (
            <Badge variant="active">Backend online</Badge>
          ) : health.status === "error" ? (
            <Badge variant="danger">Backend unreachable</Badge>
          ) : (
            <Skeleton className="h-5 w-24 rounded-full" />
          )}
          <Badge variant="neutral">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            Session expires {formatDate(session.expiresAt)}
          </Badge>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      {/* Detail panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Content types">
          {stats.status === "loading" ? (
            <div className="space-y-2.5 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : stats.status === "error" ? (
            <p className="p-4 text-sm text-ink-faint">Couldn&apos;t load content type breakdown.</p>
          ) : Object.keys(stats.data.contentTypeBreakdown).length === 0 ? (
            <p className="p-4 text-sm text-ink-faint">No active files yet.</p>
          ) : (
            (Object.entries(stats.data.contentTypeBreakdown) as [string, number][])
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([contentType, count]) => (
                <Row key={contentType} left={contentType} right={count.toLocaleString()} mono />
              ))
          )}
        </SectionCard>

        <SectionCard
          title="Cluster nodes"
          icon={Server}
          action={
            nodes.status === "ready" ? (
              <span className="font-mono text-xs text-ink-faint">
                {onlineNodeCount}/{totalNodeCount} online
              </span>
            ) : undefined
          }
        >
          {nodes.status === "loading" ? (
            <div className="space-y-2.5 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : nodes.status === "error" ? (
            <p className="p-4 text-sm text-ink-faint">Couldn&apos;t load node list.</p>
          ) : nodes.data.nodes.length === 0 ? (
            <p className="p-4 text-sm text-ink-faint">No nodes reporting.</p>
          ) : (
            nodes.data.nodes.map((node: NodeInfo) => (
              <Row
                key={node.node_id}
                left={node.node_id}
                mono
                right={
                  <Badge variant={node.status === "online" ? "active" : "danger"} className="capitalize">
                    {node.status}
                  </Badge>
                }
              />
            ))
          )}
        </SectionCard>
      </div>

      {stats.status === "ready" && stats.data.generatedAt && (
        <p className="mt-5 text-center text-xs text-ink-faint">
          Stats generated at {formatDate(stats.data.generatedAt)}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <AdminGuard>{(session) => <DashboardContent session={session} />}</AdminGuard>;
}
