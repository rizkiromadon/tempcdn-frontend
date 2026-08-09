"use client";

import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";
import type { TempCdnConfig } from "@/types/tempcdn";

// Used if /api/v1/config hasn't resolved yet, or the request fails —
// keeps the upload flow usable even when the backend is unreachable.
export const FALLBACK_CONFIG: TempCdnConfig = {
  max_upload_size_bytes: 500 * 1024 * 1024,
  max_upload_size_mb: 500,
  allowed_mime_types: [],
  blocked_extensions: [],
  file_ttl_hours: 24
};

let cached: TempCdnConfig | null = null;
let inflight: Promise<TempCdnConfig> | null = null;

function loadConfig(): Promise<TempCdnConfig> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getConfig()
      .then((cfg) => {
        cached = cfg;
        return cfg;
      })
      .catch(() => FALLBACK_CONFIG)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Returns the current server upload config, refetched once per session
 * and shared across every component that calls this hook. Falls back to
 * FALLBACK_CONFIG (the old hardcoded 500MB default) while loading or on error.
 */
export function useTempCdnConfig(): { config: TempCdnConfig; loading: boolean } {
  const [config, setConfig] = useState<TempCdnConfig>(cached ?? FALLBACK_CONFIG);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    if (cached) {
      setConfig(cached);
      setLoading(false);
      return;
    }
    loadConfig().then((cfg) => {
      if (!cancelled) {
        setConfig(cfg);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
