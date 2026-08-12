"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, Copy, Check, Trash2, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/components/admin/admin-guard";
import { createApiKey, listApiKeys, revokeApiKey, TempCdnError } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { ApiKey, AdminSession, CreateApiKeyResponse } from "@/types/tempcdn";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; keys: ApiKey[] };

function Overlay({
  onClose,
  children
}: {
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={onClose ? 0 : -1}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-[2px]",
          !onClose && "pointer-events-none"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm animate-fade-up rounded-xl border border-line bg-paper shadow-lifted"
      >
        {children}
      </div>
    </div>
  );
}

function CreateKeyModal({
  token,
  onClose,
  onCreated
}: {
  token: string;
  onClose: () => void;
  onCreated: (result: CreateApiKeyResponse) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name can't be empty");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createApiKey(token, trimmed);
      onCreated(result);
    } catch (err) {
      setError(err instanceof TempCdnError ? err.message : "Failed to create key");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">New API key</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel"
            className="rounded-full p-1 text-ink-faint transition-colors hover:bg-paper-sunk hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label htmlFor="key-name" className="mb-1.5 block text-xs font-medium text-ink-soft">
              Name
            </label>
            <input
              id="key-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. prometheus-prod"
              className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              A label to help you recognize this key later — it doesn&apos;t affect what the key
              can access.
            </p>
          </div>
          {error && <p className="text-sm text-coral">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Creating…" : "Create key"}
          </Button>
        </div>
      </form>
    </Overlay>
  );
}

function RevealKeyModal({ result, onClose }: { result: CreateApiKeyResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(result.key);
    setCopied(true);
    toast.success("Key copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Overlay>
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-bloom-strong" strokeWidth={1.75} />
          <h2 className="font-display text-base font-bold text-ink">
            &quot;{result.name}&quot; created
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">
          Copy this key now — it won&apos;t be shown again. If you lose it, revoke it and create a
          new one.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div
            className="h-10 flex-1 truncate rounded-lg border border-line bg-paper-sunk px-3 font-mono text-xs leading-10 text-ink"
            title={result.key}
          >
            {result.key}
          </div>
          <Button size="icon" variant="secondary" onClick={copy} aria-label="Copy key">
            {copied ? (
              <Check className="h-3.5 w-3.5 animate-fade-in text-sage" />
            ) : (
              <Copy className="h-3.5 w-3.5 animate-fade-in" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex justify-end border-t border-line px-5 py-3.5">
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Overlay>
  );
}

function RevokeConfirmModal({
  keyName,
  onCancel,
  onConfirm,
  revoking
}: {
  keyName: string;
  onCancel: () => void;
  onConfirm: () => void;
  revoking: boolean;
}) {
  return (
    <Overlay onClose={onCancel}>
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <ShieldOff className="h-4 w-4 text-coral" strokeWidth={1.75} />
          <h2 className="font-display text-base font-bold text-ink">Revoke this key?</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">
          Any request using <span className="font-mono text-ink">&quot;{keyName}&quot;</span> will
          stop working immediately. This can&apos;t be undone — you&apos;d need to create a new
          key instead.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={revoking}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={revoking}>
          {revoking ? "Revoking…" : "Revoke key"}
        </Button>
      </div>
    </Overlay>
  );
}

function ApiKeysContent({ session }: { session: AdminSession }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<CreateApiKeyResponse | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const keys = await listApiKeys(session.token);
      setState({ status: "ready", keys });
    } catch (err) {
      const message = err instanceof TempCdnError ? err.message : "Failed to load API keys";
      setState({ status: "error", message });
    }
  }, [session.token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleCreated(result: CreateApiKeyResponse) {
    setShowCreate(false);
    setRevealed(result);
    refresh();
  }

  async function handleConfirmRevoke() {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      await revokeApiKey(session.token, pendingRevoke.id);
      toast.success(`Revoked "${pendingRevoke.name}"`);
      setPendingRevoke(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof TempCdnError ? err.message : "Failed to revoke key");
    } finally {
      setRevoking(false);
    }
  }

  const keys = state.status === "ready" ? state.keys : [];
  const activeCount = keys.filter((k) => !k.revoked_at).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">API Keys</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Credentials for server-to-server access, like scraping{" "}
            <code className="rounded bg-paper-sunk px-1 py-0.5 font-mono text-xs">/metrics</code>.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New key
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            All keys
          </span>
          {state.status === "ready" && (
            <span className="font-mono text-xs text-ink-faint">{activeCount} active</span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {state.status === "loading" ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : state.status === "error" ? (
            <p className="p-5 text-sm text-ink-faint">{state.message}</p>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <KeyRound className="h-6 w-6 text-ink-faint" strokeWidth={1.5} />
              <p className="text-sm text-ink-faint">
                No API keys yet. Create one to authenticate server-to-server requests.
              </p>
            </div>
          ) : (
            keys.map((key) => {
              const isRevoked = Boolean(key.revoked_at);
              return (
                <div
                  key={key.id}
                  className={cn(
                    "flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-b-0",
                    isRevoked && "opacity-60"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{key.name}</span>
                      {isRevoked ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : (
                        <Badge variant="active">Active</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">
                      Created {formatDate(key.created_at)}
                      {key.last_used_at && ` · Last used ${formatDate(key.last_used_at)}`}
                      {key.revoked_at && ` · Revoked ${formatDate(key.revoked_at)}`}
                    </p>
                  </div>
                  {!isRevoked && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Revoke ${key.name}`}
                      onClick={() => setPendingRevoke(key)}
                      className="shrink-0 hover:text-coral"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {showCreate && (
        <CreateKeyModal token={session.token} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {revealed && <RevealKeyModal result={revealed} onClose={() => setRevealed(null)} />}
      {pendingRevoke && (
        <RevokeConfirmModal
          keyName={pendingRevoke.name}
          revoking={revoking}
          onCancel={() => setPendingRevoke(null)}
          onConfirm={handleConfirmRevoke}
        />
      )}
    </div>
  );
}

export default function ApiKeysPage() {
  return <AdminGuard>{(session) => <ApiKeysContent session={session} />}</AdminGuard>;
}
