"use client";

import { useState } from "react";
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  FileCode,
  File as FileIcon
} from "lucide-react";
import { cn, getFileKind } from "@/lib/utils";

interface FilePreviewProps {
  src: string;
  contentType: string;
  alt: string;
  className?: string;
  iconOnly?: boolean;
}

const kindIcon: Record<string, typeof FileIcon> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  text: FileCode,
  archive: FileArchive,
  other: FileIcon
};

export function FilePreview({ src, contentType, alt, className, iconOnly }: FilePreviewProps) {
  const kind = getFileKind(contentType);
  const [errored, setErrored] = useState(false);
  const Icon = kindIcon[kind] ?? FileIcon;

  const showImage = kind === "image" && !iconOnly && !errored;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-steel-dim bg-void",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      ) : (
        <Icon className="h-1/3 w-1/3 min-h-4 min-w-4 text-bone-faint" strokeWidth={1.5} />
      )}
    </div>
  );
}
