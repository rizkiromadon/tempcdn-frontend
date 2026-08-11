"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ArrowRight, Inbox, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getRecentEntries, type RecentEntry } from "@/lib/history";
import { FilePreview } from "@/components/tempcdn/file-preview";
import { formatBytes, truncateMiddle, msUntil, formatCountdown } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PAGE_SIZE = 10;

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
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setEntries(getRecentEntries());
  }, []);

  // Poll lightly so expired entries disappear without a full refresh.
  useEffect(() => {
    const interval = setInterval(() => setEntries(getRecentEntries()), 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.original_name.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q) ||
        entry.content_type.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Keep the current page in range whenever the filtered set or its
  // length changes (new search, entries expiring off the list, etc.).
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

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

  const start = (page - 1) * PAGE_SIZE;
  const pageEntries = filtered.slice(start, start + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by file name, ID, or type..."
          aria-label="Search recent uploads"
          className="h-10 w-full rounded-full border border-line bg-paper pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-bloom focus:outline-none focus:ring-4 focus:ring-bloom/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint transition-colors duration-150 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line bg-paper-sunk py-8 text-center animate-fade-in">
          <p className="text-sm font-medium text-ink-soft">No matches for &quot;{query}&quot;</p>
          <p className="text-xs text-ink-faint">Try a different name, file ID, or content type.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageEntries.map((entry) => (
              <RecentEntryRow key={entry.id} entry={entry} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-faint">
                Showing {rangeStart} to {rangeEnd} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="min-w-[3.5rem] text-center text-xs font-medium text-ink-soft">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
