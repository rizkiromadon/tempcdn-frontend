"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminLogin, TempCdnError } from "@/lib/api";
import { setAdminSession, getAdminSession } from "@/lib/admin-auth";

/**
 * Login form for the admin dashboard. On success, persists the session
 * (see lib/admin-auth.ts) and navigates to /dashboard; the dashboard page
 * itself re-verifies the token against GET /api/v1/admin/me on load, so
 * this component doesn't need to.
 */
export function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If a (not-yet-expired, per getAdminSession's own check) session is
  // already stored, skip the form entirely - the dashboard page will
  // still re-verify it against the server on load, so this is just
  // avoiding an unnecessary login prompt, not a security boundary.
  useEffect(() => {
    if (getAdminSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await adminLogin(username.trim(), password);
      setAdminSession({
        token: result.token,
        username: result.username,
        expiresAt: result.expires_at
      });
      toast.success("Logged in", { description: `Welcome back, ${result.username}.` });
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof TempCdnError
          ? err.message
          : "Couldn't reach the server — check your connection and try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="admin-username" className="text-xs font-medium text-ink-soft">
          Username
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="h-10 w-full rounded-lg border border-line bg-paper pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-bloom focus:outline-none focus:ring-4 focus:ring-bloom/10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="admin-password" className="text-xs font-medium text-ink-soft">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="h-10 w-full rounded-lg border border-line bg-paper pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-bloom focus:outline-none focus:ring-4 focus:ring-bloom/10"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-coral/30 bg-coral-soft px-3 py-2 text-xs text-coral">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={submitting || !username.trim() || !password}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging in…
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
