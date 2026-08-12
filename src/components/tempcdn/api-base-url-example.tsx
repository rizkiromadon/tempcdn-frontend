"use client";

import { useEffect, useState } from "react";
import { getApiBases } from "@/lib/api";

/**
 * Renders a live API base URL (with "/upload" appended) inline in a curl
 * example, without forcing the containing page to be server-rendered on
 * every request.
 *
 * Starts out showing `fallback` (a representative, hardcoded example URL)
 * so the page has correct-looking content immediately on first paint/SSR,
 * then swaps in the real, currently-online node URL once `getApiBases()`
 * resolves client-side after hydration. If discovery fails, the fallback
 * is left in place rather than showing an error inline in a code sample.
 */
export function ApiBaseUrlExample({ fallback }: { fallback: string }) {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    getApiBases()
      .then((bases) => {
        if (!cancelled && bases.length > 0) setUrl(`${bases[0]}/upload`);
      })
      .catch(() => {
        // Keep showing the fallback — a broken curl example in a code
        // block is worse than a slightly-generic-but-correct one.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{url}</>;
}
