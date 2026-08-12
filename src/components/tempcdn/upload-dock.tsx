"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDockProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  maxSizeLabel?: string;
  acceptedMimeTypes?: string[];
}

export function UploadDock({ onFiles, disabled, maxSizeLabel, acceptedMimeTypes }: UploadDockProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length) onFiles(accepted);
    },
    [onFiles]
  );

  const accept =
    acceptedMimeTypes && acceptedMimeTypes.length > 0
      ? acceptedMimeTypes.reduce<Record<string, string[]>>((acc, mime) => {
          acc[mime] = [];
          return acc;
        }, {})
      : undefined;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    accept
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-line bg-paper px-6 py-16 text-center shadow-soft transition-all duration-200",
        "hover:border-bloom/50 hover:bg-bloom-soft/40",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15",
        isDragActive && "border-bloom bg-bloom-soft scale-[1.01]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong transition-all duration-200",
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
            or click to browse
          </p>
          <p className="text-xs text-ink-faint">
            {maxSizeLabel ?? "checking upload limits..."} · multiple files supported
          </p>
        </div>
      </div>
    </div>
  );
}

