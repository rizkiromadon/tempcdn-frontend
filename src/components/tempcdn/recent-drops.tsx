"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ArrowRight, Inbox } from "lucide-react";
import { getRecentEntries, type RecentEntry } from "@/lib/history";
import { FilePreview } from "@/components/tempcdn/file-preview";
import { formatBytes, truncateMiddle, msUntil, formatCountdown } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function RecentEntryRow({ entry }: { entry: RecentEntry }) {
  const [remaining, setRemaining] = useState(() => msUntil(entry.expires_at));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntil(entry.expires_at)), 1000);
    return () => clearInterval(interval);
  }, [entry.expires_at]);

  if (remaining <= 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3.5 shadow-soft animate-fade-up">
      <FilePreview
        src={entry.cdn_url}
        contentType={entry.content_type}
        alt={entry.original_name}
        className="h-9 w-9 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={entry.original_name}>
          {entry.original_name}
        </p>
        <p className="text-xs text-ink-faint">
          {formatBytes(entry.size_bytes)} · fades in {formatCountdown(remaining)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Copy link"
          onClick={() => {
            navigator.clipboard.writeText(entry.cdn_url);
            toast.success("Link copied", { description: truncateMiddle(entry.cdn_url, 20, 14) });
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" asChild aria-label="View file detail">
          <Link href={`/files/${entry.id}`}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function RecentDrops() {
  const [entries, setEntries] = useState<RecentEntry[] | null>(null);

  useEffect(() => {
    setEntries(getRecentEntries());
  }, []);

  // Poll lightly so expired entries disappear without a full refresh.
  useEffect(() => {
    const interval = setInterval(() => setEntries(getRecentEntries()), 15000);
    return () => clearInterval(interval);
  }, []);

  if (entries === null) return null;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-paper-sunk py-10 text-center animate-fade-in">
        <Inbox className="h-5 w-5 text-ink-faint" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-soft">
          Nothing uploaded yet on this device
        </p>
        <p className="max-w-xs text-xs text-ink-faint">
          Files you upload here will show up in this list until they expire —
          only visible to you, stored locally in this browser.
        </p>
      </div>
    );
  }

  return <div className="space-y-2">{entries.map((entry) => <RecentEntryRow key={entry.id} entry={entry} />)}</div>;
}
