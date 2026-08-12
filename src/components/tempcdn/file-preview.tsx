"use client";

import { useState } from "react";
import Image from "next/image";
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
        "relative flex items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-sunk",
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="44px"
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <Icon className="h-1/3 w-1/3 min-h-4 min-w-4 text-ink-faint" strokeWidth={1.5} />
      )}
    </div>
  );
}
