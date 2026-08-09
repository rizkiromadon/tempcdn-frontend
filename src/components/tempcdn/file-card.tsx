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
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2 text-bone-faint">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={`truncate text-right text-xs text-bone ${mono ? "font-mono" : ""}`}
          title={value}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="shrink-0 text-bone-faint transition-colors hover:text-hazard"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FileCard({ file, onDelete, deleting }: FileCardProps) {
  const isExpired = file.expired ?? false;

  function copyValue(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <Card className="clip-corner">
      <CardHeader className="items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FilePreview
            src={file.cdn_url}
            contentType={file.content_type}
            alt={file.original_name}
            className="h-11 w-11 shrink-0 rounded-sm"
          />
          <div className="min-w-0">
            <span className="block truncate font-mono text-sm font-semibold text-bone" title={file.original_name}>
              {file.original_name}
            </span>
            <span className="block truncate font-mono text-[10px] text-bone-faint">
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
          <div className="flex items-center gap-3 border border-rust-dim/60 bg-rust/5 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-rust-glow" />
            <p className="text-xs text-bone-dim">
              This file was purged on schedule. The link and its content are gone for good.
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
            share link
          </p>
          <SharePanel url={file.cdn_url} disabled={isExpired} />
        </div>

        <div className="divide-y divide-steel-dim/60 border-y border-steel-dim/60">
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
      </CardContent>
    </Card>
  );
}
