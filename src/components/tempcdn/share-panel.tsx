"use client";

import { useEffect, useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SharePanelProps {
  url: string;
  disabled?: boolean;
}

export function SharePanel({ url, disabled }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  async function copy() {
    if (disabled) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  }

  // Generated fully client-side (no network call) so the file's URL never
  // leaves the browser — a third-party QR image service would otherwise see
  // every URL a user shares, which contradicts "nothing left behind".
  useEffect(() => {
    if (!showQr || disabled) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 180,
      margin: 2,
      color: { dark: "#1F2430", light: "#FFFFFF" }
    })
      .then((dataUrl) => {
        if (!cancelled) setQrSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showQr, disabled, url]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-10 flex-1 truncate rounded-lg border border-line bg-paper-sunk px-3 font-mono text-xs leading-10 text-ink-soft",
            disabled && "opacity-50"
          )}
          title={url}
        >
          {url}
        </div>
        <Button size="icon" variant="secondary" onClick={copy} disabled={disabled} aria-label="Copy link">
          {copied ? (
            <Check className="h-3.5 w-3.5 animate-fade-in text-sage" />
          ) : (
            <Copy className="h-3.5 w-3.5 animate-fade-in" />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowQr((v) => !v)}
          disabled={disabled}
          aria-label="Toggle QR code"
          aria-pressed={showQr}
        >
          <QrCode className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showQr && !disabled && (
        <div className="flex animate-fade-up items-center gap-3 rounded-xl border border-line bg-paper-sunk p-3">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrSrc}
              alt="QR code linking to the file"
              width={90}
              height={90}
              className="shrink-0 rounded-lg border border-line bg-paper"
            />
          ) : (
            <div className="h-[90px] w-[90px] shrink-0 animate-pulse rounded-lg border border-line bg-paper" />
          )}
          <p className="text-sm leading-relaxed text-ink-soft">
            Scan to open this file on another device. The code stops working the
            moment the link expires.
          </p>
        </div>
      )}
    </div>
  );
}
