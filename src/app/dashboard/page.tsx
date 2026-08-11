"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { BackendStatus } from "@/components/admin/backend-status";
import { formatDate } from "@/lib/utils";
import type { AdminSession } from "@/types/tempcdn";

function DashboardContent({ session }: { session: AdminSession }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">Signed in as {session.username}.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Account
            </span>
            <ShieldCheck className="h-4 w-4 text-sage" strokeWidth={1.75} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Username</span>
              <span className="font-mono text-ink">{session.username}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Session expires</span>
              <span className="text-ink">{formatDate(session.expiresAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Status
            </span>
          </CardHeader>
          <CardContent>
            <BackendStatus />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <AdminGuard>{(session) => <DashboardContent session={session} />}</AdminGuard>;
}
