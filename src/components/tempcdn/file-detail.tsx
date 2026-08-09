"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { FileCard } from "@/components/tempcdn/file-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getFileInfo, deleteFile, TempCdnError } from "@/lib/api";
import { removeRecentEntry } from "@/lib/history";
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
    <div className="animate-fade-up border border-steel-dim bg-surface">
      <div className="flex items-center gap-3 border-b border-steel-dim px-4 py-3">
        <Skeleton className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="space-y-3 border-y border-steel-dim/60 py-3">
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
  const router = useRouter();

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

  async function handleDelete(fileId: string) {
    setDeleting(true);
    try {
      await deleteFile(fileId);
      removeRecentEntry(fileId);
      toast.success("File deleted");
      router.push("/");
    } catch (err) {
      const message = err instanceof TempCdnError ? err.message : "Delete failed";
      toast.error("Could not delete file", { description: message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-10 sm:pt-14">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => router.push("/")}>
        <ArrowLeft className="h-3.5 w-3.5" />
        back to dock
      </Button>

      {state.kind === "loading" && <DetailSkeleton />}

      {state.kind === "not-found" && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-steel py-20 text-center animate-fade-up">
          <AlertTriangle className="h-6 w-6 text-rust-glow" />
          <p className="font-mono text-sm font-semibold text-bone">no record found</p>
          <p className="max-w-xs text-xs text-bone-dim">
            nothing on the dock matches id{" "}
            <span className="font-mono text-bone">{id}</span>. it may have never
            existed, expired and been purged, or the id was mistyped.
          </p>
          <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
            drop a new file
          </Button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-rust-dim py-20 text-center animate-fade-up">
          <AlertTriangle className="h-6 w-6 text-rust-glow" />
          <p className="font-mono text-sm font-semibold text-bone">lookup failed</p>
          <p className="max-w-xs text-xs text-bone-dim">{state.message}</p>
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
        <FileCard file={state.file} onDelete={handleDelete} deleting={deleting} />
      )}
    </div>
  );
}
