"use client";

import { useEffect, useState } from "react";
import { getApiBases } from "@/lib/api";

export function ApiBaseUrlExample({ fallback }: { fallback: string }) {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    getApiBases()
      .then((bases) => {
        if (!cancelled && bases.length > 0) setUrl(`${bases[0]}/upload`);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{url}</>;
}
