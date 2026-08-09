"use client";

import { File as FileIcon, CheckCircle2, XCircle, Loader2, Copy, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, truncateMiddle } from "@/lib/utils";
import type { UploadTask } from "@/types/tempcdn";
import { toast } from "sonner";

interface UploadRowProps {
  task: UploadTask;
  onRemove: (clientId: string) => void;
}

export function UploadRow({ task, onRemove }: UploadRowProps) {
  const { file, status, progress, result, error } = task;

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.cdn_url);
    toast.success("Link copied", { description: truncateMiddle(result.cdn_url, 24, 18) });
  }

  return (
    <div className="flex items-start gap-3 border border-steel-dim bg-surface-raised p-3 animate-fade-up">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-steel-dim bg-void text-bone-dim">
        {status === "done" && <CheckCircle2 className="h-4 w-4 text-signal" />}
        {status === "error" && <XCircle className="h-4 w-4 text-rust-glow" />}
        {(status === "uploading" || status === "queued") && (
          <Loader2 className="h-4 w-4 animate-spin text-hazard" />
        )}
        {status !== "done" && status !== "error" && status !== "uploading" && status !== "queued" && (
          <FileIcon className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xs font-medium text-bone">
            {file.name}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-bone-faint">
            {formatBytes(file.size)}
          </span>
        </div>

        {(status === "uploading" || status === "queued") && (
          <Progress value={progress} />
        )}

        {status === "done" && result && (
          <div className="flex flex-wrap items-center gap-2">
            {result.duplicate && <Badge variant="warning">deduped</Badge>}
            <Badge variant="active">stored</Badge>
            <span className="truncate font-mono text-[10px] text-bone-faint">
              {truncateMiddle(result.cdn_url, 20, 14)}
            </span>
          </div>
        )}

        {status === "error" && (
          <p className="font-mono text-[11px] text-rust-glow">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {status === "done" && result && (
          <Button size="icon" variant="ghost" onClick={copyLink} aria-label="Copy link">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(task.clientId)}
          aria-label="Remove from list"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
