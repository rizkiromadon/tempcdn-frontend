"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { FileCard } from "@/components/tempcdn/file-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getFileInfo, deleteFile, TempCdnError } from "@/lib/api";
import { getRecentEntry, removeRecentEntry } from "@/lib/history";
import type { UploadedFile } from "@/types/tempcdn";
import { toast } from "sonner";

interface FileDetailProps {
  id: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; file: UploadedFile };

function DetailSkeleton() {
  return (
    <div className="animate-fade-up rounded-xl border border-line bg-paper shadow-soft">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="space-y-3 border-y border-line py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FileDetail({ id }: FileDetailProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [cameFromInApp, setCameFromInApp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only treat "back" as safe to use when we actually navigated here
    // from elsewhere in this app (e.g. clicked from /upload's recent
    // list). A fresh load — direct link, new tab, refresh — has no
    // in-app history to go back to, so router.back() would either do
    // nothing or leave the site entirely.
    try {
      const ref = document.referrer;
      setCameFromInApp(Boolean(ref) && new URL(ref).origin === window.location.origin);
    } catch {
      setCameFromInApp(false);
    }
  }, []);

  /**
   * Returns to wherever the user came from (recent uploads, lookup
   * search, etc.) instead of always dropping them on the landing page.
   * Falls back to /upload — not "/" — since every path that leads here
   * (recent drops, the lookup form, a freshly uploaded file) originates
   * from the upload page, not the marketing landing page.
   */
  function goBack() {
    if (cameFromInApp) {
      router.back();
    } else {
      router.push("/upload");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });
      try {
        const file = await getFileInfo(id);
        if (!cancelled) setState({ kind: "loaded", file });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof TempCdnError && err.status === 404) {
          setState({ kind: "not-found" });
        } else {
          const message = err instanceof TempCdnError ? err.message : "Something went wrong";
          setState({ kind: "error", message });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  // The API only returns delete_token once, in the /upload response — a
  // GET here never includes it. So the only place we can still have it is
  // this browser's local upload history, keyed by id. If it's missing
  // (shared link, different device, or uploaded before this rollout),
  // deletion is simply no longer possible for this file.
  const deleteToken = getRecentEntry(id)?.delete_token;

  async function handleDelete(fileId: string) {
    if (!deleteToken) return;
    setDeleting(true);
    try {
      await deleteFile(fileId, deleteToken);
      removeRecentEntry(fileId);
      toast.success("File deleted");
      goBack();
    } catch (err) {
      const message = err instanceof TempCdnError ? err.message : "Delete failed";
      toast.error("Could not delete file", { description: message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-10 sm:pt-14">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={goBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        back
      </Button>

      {state.kind === "loading" && (
        <>
          <h1 className="sr-only">Loading file details</h1>
          <DetailSkeleton />
        </>
      )}

      {state.kind === "not-found" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-20 text-center animate-fade-up">
          <AlertTriangle className="h-6 w-6 text-coral" />
          <h1 className="text-sm font-semibold text-ink">no file found</h1>
          <p className="max-w-xs text-sm text-ink-soft">
            nothing matches id{" "}
            <span className="font-mono text-ink">{id}</span>. it may have never
            existed, expired already, or the id was mistyped.
          </p>
          <Button variant="secondary" size="sm" onClick={() => router.push("/upload")}>
            upload a new file
          </Button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-coral/30 py-20 text-center animate-fade-up">
          <AlertTriangle className="h-6 w-6 text-coral" />
          <h1 className="text-sm font-semibold text-ink">lookup failed</h1>
          <p className="max-w-xs text-sm text-ink-soft">{state.message}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAttempt((n) => n + 1)}
          >
            try again
          </Button>
        </div>
      )}

      {state.kind === "loaded" && (
        <FileCard
          file={state.file}
          onDelete={deleteToken ? handleDelete : undefined}
          deleting={deleting}
          deleteUnavailableReason={
            !deleteToken
              ? "Deletion is only available in the browser tab that uploaded this file."
              : undefined
          }
        />
      )}
    </div>
  );
}
