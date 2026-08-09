"use client";

import type { ElementType } from "react";
import { Copy, ExternalLink, Trash2, Hash, Calendar, HardDrive, FileType } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BurnTimer } from "@/components/tempcdn/burn-timer";
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
  mono = true
}: {
  icon: ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2 text-bone-faint">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <span
        className={`truncate text-right text-xs text-bone ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

export function FileCard({ file, onDelete, deleting }: FileCardProps) {
  const isExpired = file.expired ?? false;

  async function copyLink() {
    await navigator.clipboard.writeText(file.cdn_url);
    toast.success("Link copied to clipboard");
  }

  return (
    <Card className="clip-corner">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-sm font-semibold text-bone">
            {file.original_name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {file.duplicate && <Badge variant="warning">deduped</Badge>}
          {isExpired ? (
            <Badge variant="danger">expired</Badge>
          ) : (
            <Badge variant="active">active</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isExpired && (
          <BurnTimer expiresAt={file.expires_at} createdAt={file.created_at} />
        )}

        <div className="divide-y divide-steel-dim/60 border-y border-steel-dim/60">
          <MetaRow icon={FileType} label="type" value={file.content_type} />
          <MetaRow icon={HardDrive} label="size" value={formatBytes(file.size_bytes)} />
          <MetaRow icon={Hash} label="sha-256" value={truncateMiddle(file.checksum_sha256, 10, 8)} />
          <MetaRow icon={Calendar} label="created" value={formatDate(file.created_at)} />
          <MetaRow icon={Calendar} label="expires" value={formatDate(file.expires_at)} />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={copyLink} disabled={isExpired}>
            <Copy className="h-3.5 w-3.5" />
            copy link
          </Button>
          <Button size="sm" variant="outline" asChild={!isExpired} disabled={isExpired}>
            {isExpired ? (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                open
              </>
            ) : (
              <a href={file.cdn_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                open
              </a>
            )}
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="danger"
              className="ml-auto"
              onClick={() => onDelete(file.id)}
              disabled={isExpired || deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "deleting..." : "delete now"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
