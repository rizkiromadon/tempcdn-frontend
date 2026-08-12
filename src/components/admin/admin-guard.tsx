"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminSession } from "@/lib/use-admin-session";
import type { AdminSession } from "@/types/tempcdn";

export function AdminGuard({
  children
}: {
  children: (session: AdminSession) => React.ReactNode;
}) {
  const { status, session } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/dashboard/login");
    }
  }, [status, router]);

  if (status === "authenticated" && session) {
    return <>{children(session)}</>;
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-ink-faint" aria-label="Checking session…" />
    </div>
  );
}
