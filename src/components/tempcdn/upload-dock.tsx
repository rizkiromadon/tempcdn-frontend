"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDockProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  maxSizeLabel?: string;
}

export function UploadDock({ onFiles, disabled, maxSizeLabel }: UploadDockProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length) onFiles(accepted);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-line bg-paper px-6 py-16 text-center shadow-soft transition-all",
        "hover:border-bloom/50 hover:bg-bloom-soft/40",
        isDragActive && "border-bloom bg-bloom-soft scale-[1.01]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong transition-all",
            "group-hover:scale-105",
            isDragActive && "scale-110 bg-bloom text-white animate-breathe"
          )}
        >
          {isDragActive ? (
            <Sparkles className="h-7 w-7" strokeWidth={1.75} />
          ) : (
            <UploadCloud className="h-7 w-7" strokeWidth={1.75} />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold text-ink">
            {isDragActive ? "Let go to upload" : "Drop files here"}
          </p>
          <p className="text-sm text-ink-soft">
            or click to browse. Every file fades away after its lifespan.
          </p>
          <p className="text-xs text-ink-faint">
            {maxSizeLabel ?? "checking upload limits..."} · multiple files supported
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="rounded-full border border-line bg-paper-sunk px-2.5 py-1 text-[11px] text-ink-soft">
            no login
          </span>
          <span className="rounded-full border border-line bg-paper-sunk px-2.5 py-1 text-[11px] text-ink-soft">
            auto-expires
          </span>
          <span className="rounded-full border border-line bg-paper-sunk px-2.5 py-1 text-[11px] text-ink-soft">
            dedup by checksum
          </span>
        </div>
      </div>
    </div>
  );
}

