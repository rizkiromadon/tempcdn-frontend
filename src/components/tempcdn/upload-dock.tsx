"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDockProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadDock({ onFiles, disabled }: UploadDockProps) {
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
        "group relative cursor-pointer overflow-hidden border-2 border-dashed border-steel bg-surface-hatch px-6 py-16 text-center transition-colors",
        "hover:border-hazard/60",
        isDragActive && "border-hazard bg-hazard/5",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-8 w-full bg-gradient-to-b from-hazard/10 to-transparent opacity-0 transition-opacity",
          isDragActive && "opacity-100 animate-scan"
        )}
      />

      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center border border-steel bg-void text-bone-dim transition-all",
            "group-hover:border-hazard group-hover:text-hazard",
            isDragActive && "border-hazard text-hazard scale-105"
          )}
        >
          {isDragActive ? (
            <PackagePlus className="h-7 w-7" strokeWidth={1.75} />
          ) : (
            <UploadCloud className="h-7 w-7" strokeWidth={1.75} />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-bone">
            {isDragActive ? "release to load" : "drop files on the dock"}
          </p>
          <p className="text-xs text-bone-dim">
            or click to browse. every file self-destructs after its TTL.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="border border-steel-dim px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bone-faint">
            no login
          </span>
          <span className="border border-steel-dim px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bone-faint">
            auto-expire
          </span>
          <span className="border border-steel-dim px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bone-faint">
            dedup by checksum
          </span>
        </div>
      </div>
    </div>
  );
}
