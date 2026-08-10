"use client";

import type { ElementType } from "react";
import { Trash2, Hash, Calendar, HardDrive, FileType, Copy } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BurnTimer } from "@/components/tempcdn/burn-timer";
import { SharePanel } from "@/components/tempcdn/share-panel";
import { FilePreview } from "@/components/tempcdn/file-preview";
import { formatBytes, formatDate, truncateMiddle } from "@/lib/utils";
import type { UploadedFile } from "@/types/tempcdn";
import { toast } from "sonner";

interface FileCardProps {
  file: UploadedFile;
  onDelete?: (id: string) => void;
  deleting?: boolean;
  /**
   * When delete isn't possible (no local delete token for this file),
   * show this instead of the delete button so it reads as "not available
   * here" rather than the button silently disappearing.
   */
  deleteUnavailableReason?: string;
}

function MetaRow({
  icon: Icon,
  label,
  value,
  mono = true,
  onCopy
}: {
  icon: ElementType;
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={`truncate text-right text-xs text-ink ${mono ? "font-mono" : ""}`}
          title={value}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="shrink-0 text-ink-faint transition-colors hover:text-bloom-strong"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FileCard({ file, onDelete, deleting, deleteUnavailableReason }: FileCardProps) {
  const isExpired = file.expired ?? false;

  function copyValue(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader className="items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FilePreview
            src={file.cdn_url}
            contentType={file.content_type}
            alt={file.original_name}
            className="h-11 w-11 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink" title={file.original_name}>
              {file.original_name}
            </span>
            <span className="block truncate font-mono text-[11px] text-ink-faint">
              {truncateMiddle(file.id, 10, 6)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {file.duplicate && <Badge variant="warning">deduped</Badge>}
          {isExpired ? <Badge variant="danger">expired</Badge> : <Badge variant="active">active</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!isExpired ? (
          <BurnTimer expiresAt={file.expires_at} createdAt={file.created_at} variant="gauge" />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-coral/20 bg-coral-soft px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />
            <p className="text-sm text-ink-soft">
              This file expired on schedule. The link and its content are gone for good.
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-ink-faint">share link</p>
          <SharePanel url={file.cdn_url} disabled={isExpired} />
        </div>

        <div className="divide-y divide-line border-y border-line">
          <MetaRow icon={FileType} label="type" value={file.content_type} />
          <MetaRow icon={HardDrive} label="size" value={formatBytes(file.size_bytes)} />
          <MetaRow
            icon={Hash}
            label="sha-256"
            value={truncateMiddle(file.checksum_sha256, 10, 8)}
            onCopy={() => copyValue(file.checksum_sha256, "Checksum")}
          />
          <MetaRow icon={Calendar} label="created" value={formatDate(file.created_at)} />
          <MetaRow icon={Calendar} label="expires" value={formatDate(file.expires_at)} />
        </div>

        {onDelete && (
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(file.id)}
              disabled={isExpired || deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "deleting..." : "delete now"}
            </Button>
          </div>
        )}

        {!onDelete && !isExpired && deleteUnavailableReason && (
          <p className="pt-1 text-right text-xs text-ink-faint">{deleteUnavailableReason}</p>
        )}
      </CardContent>
    </Card>
  );
}
