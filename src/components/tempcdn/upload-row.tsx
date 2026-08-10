"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Copy, X, ArrowRight, RotateCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePreview } from "@/components/tempcdn/file-preview";
import { formatBytes, truncateMiddle } from "@/lib/utils";
import type { UploadTask } from "@/types/tempcdn";
import { toast } from "sonner";

interface UploadRowProps {
  task: UploadTask;
  onRemove: (clientId: string) => void;
  onRetry?: (clientId: string) => void;
}

export function UploadRow({ task, onRemove, onRetry }: UploadRowProps) {
  const { file, status, progress, result, error } = task;

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.cdn_url);
    toast.success("Link copied", { description: truncateMiddle(result.cdn_url, 24, 18) });
  }

  const objectUrl = status === "done" && result ? result.cdn_url : undefined;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-3.5 shadow-soft animate-fade-up">
      {objectUrl ? (
        <FilePreview
          src={objectUrl}
          contentType={result!.content_type}
          alt={file.name}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-lg"
        />
      ) : (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-sunk text-ink-faint">
          {status === "error" && <XCircle className="h-4 w-4 text-coral" />}
          {(status === "uploading" || status === "queued") && (
            <Loader2 className="h-4 w-4 animate-spin text-bloom" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="shrink-0 text-xs text-ink-faint">
            {formatBytes(file.size)}
          </span>
        </div>

        {(status === "uploading" || status === "queued") && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-ink-faint">
              {status === "queued" ? "queued..." : `${progress}%`}
            </p>
          </div>
        )}

        {status === "done" && result && (
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
            {result.duplicate && <Badge variant="warning">deduped</Badge>}
            <Badge variant="active">stored</Badge>
            <span className="truncate text-xs text-ink-faint">
              {truncateMiddle(result.cdn_url, 20, 14)}
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-coral">{error}</p>
            {onRetry && (
              <button
                onClick={() => onRetry(task.clientId)}
                className="flex shrink-0 items-center gap-1 rounded-md text-xs font-medium text-ink-faint transition-all duration-150 hover:text-bloom-strong active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
              >
                <RotateCw className="h-3 w-3" />
                retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {status === "done" && result && (
          <>
            <Button size="icon" variant="ghost" onClick={copyLink} aria-label="Copy link">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" asChild aria-label="View file detail">
              <Link href={`/files/${result.id}`}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
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
