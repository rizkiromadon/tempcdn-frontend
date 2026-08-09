"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileSearch, ArrowLeft } from "lucide-react";
import { FileCard } from "@/components/tempcdn/file-card";
import { Button } from "@/components/ui/button";
import { getFileInfo, deleteFile, TempCdnError } from "@/lib/api";
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

export function FileDetail({ id }: FileDetailProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
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
  }, [id]);

  async function handleDelete(fileId: string) {
    setDeleting(true);
    try {
      await deleteFile(fileId);
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
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        back to dock
      </Button>

      {state.kind === "loading" && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-steel py-20 text-center">
          <FileSearch className="h-6 w-6 animate-pulse-slow text-bone-faint" />
          <p className="font-mono text-xs uppercase tracking-widest text-bone-faint">
            retrieving record...
          </p>
        </div>
      )}

      {state.kind === "not-found" && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-steel py-20 text-center">
          <AlertTriangle className="h-6 w-6 text-rust-glow" />
          <p className="font-mono text-sm font-semibold text-bone">no record found</p>
          <p className="max-w-xs text-xs text-bone-dim">
            nothing on the dock matches id{" "}
            <span className="font-mono text-bone">{id}</span>. it may have never
            existed, or the id was mistyped.
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-rust-dim py-20 text-center">
          <AlertTriangle className="h-6 w-6 text-rust-glow" />
          <p className="font-mono text-sm font-semibold text-bone">lookup failed</p>
          <p className="max-w-xs text-xs text-bone-dim">{state.message}</p>
        </div>
      )}

      {state.kind === "loaded" && (
        <FileCard file={state.file} onDelete={handleDelete} deleting={deleting} />
      )}
    </div>
  );
}
