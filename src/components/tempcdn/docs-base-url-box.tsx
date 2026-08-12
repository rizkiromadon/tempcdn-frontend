"use client";

import { useEffect, useState } from "react";
import { getApiBases } from "@/lib/api";

const FALLBACK_BASE = "https://srv1.tempcdn.example.com/api/v1";

export function DocsBaseUrlBox() {
  const [bases, setBases] = useState<readonly string[]>([FALLBACK_BASE]);

  useEffect(() => {
    let cancelled = false;
    getApiBases()
      .then((online) => {
        if (!cancelled && online.length > 0) setBases(online);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-lg rounded-xl border border-line bg-paper p-5 shadow-soft">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
        base url
      </div>
      <code className="text-mono-tight break-all font-mono text-sm text-bloom-strong">
        {bases[0]}
      </code>
      <p className="mt-3 text-sm leading-relaxed text-ink-faint">
        All endpoints below are relative to this base url.
        {bases.length > 1 ? (
          <>
            {" "}This is one of {bases.length} nodes currently online. The
            frontend rotates requests across all of them and retries the
            next node on a timeout or 5xx, so you can call any node in the
            list — you don&apos;t need to pin to this specific one.
          </>
        ) : (
          <>
            {" "}Only one node is currently configured or reachable, so
            there&apos;s nothing to round-robin against right now.
          </>
        )}
      </p>
      {bases.length > 1 && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            all online nodes
          </div>
          <ul className="space-y-1.5">
            {bases.map((base) => (
              <li key={base} className="font-mono text-xs text-ink-soft">
                {base}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
