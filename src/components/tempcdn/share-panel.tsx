"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
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

  async function copy() {
    if (disabled) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  }

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&color=E8E6E1&bgcolor=141618&data=${encodeURIComponent(
    url
  )}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-9 flex-1 truncate border border-steel bg-void px-3 font-mono text-[11px] leading-9 text-bone-dim",
            disabled && "opacity-50"
          )}
          title={url}
        >
          {url}
        </div>
        <Button size="icon" variant="secondary" onClick={copy} disabled={disabled} aria-label="Copy link">
          {copied ? <Check className="h-3.5 w-3.5 text-signal" /> : <Copy className="h-3.5 w-3.5" />}
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
        <div className="flex animate-fade-up items-center gap-3 border border-steel-dim bg-surface-raised p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="QR code linking to the file"
            width={90}
            height={90}
            className="shrink-0 border border-steel-dim bg-void"
          />
          <p className="text-xs leading-relaxed text-bone-dim">
            Scan to open this file on another device. The code stops working the
            moment the link expires.
          </p>
        </div>
      )}
    </div>
  );
}
