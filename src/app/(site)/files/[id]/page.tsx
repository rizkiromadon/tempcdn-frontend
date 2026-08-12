import type { Metadata } from "next";
import { FileDetail } from "@/components/tempcdn/file-detail";
import { getFileInfo } from "@/lib/api";
import { formatBytes, formatCountdown, msUntil, getFileKind } from "@/lib/utils";

interface FilePageProps {
  params: { id: string };
}

const FALLBACK_METADATA: Metadata = {
  title: "File",
  description: "Anonymous file sharing with automatic expiry. No login, nothing left behind.",
  robots: { index: false, follow: true }
};

export async function generateMetadata({ params }: FilePageProps): Promise<Metadata> {
  try {
    const file = await getFileInfo(params.id);

    if (file.expired) {
      return FALLBACK_METADATA;
    }

    const remaining = msUntil(file.expires_at);
    const description =
      remaining > 0
        ? `${formatBytes(file.size_bytes)} · expires in ${formatCountdown(remaining)}`
        : `${formatBytes(file.size_bytes)} · expired`;

    const isActiveImage = getFileKind(file.content_type) === "image" && remaining > 0;

    return {
      title: file.original_name,
      description,
      robots: { index: false, follow: true },
      openGraph: {
        title: file.original_name,
        description,
        type: "website",
        images: isActiveImage
          ? [{ url: file.cdn_url }]
          : [
              {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "TempCDN — files pass through, they don't stay"
              }
            ]
      },
      twitter: {
        card: isActiveImage ? "summary_large_image" : "summary",
        title: file.original_name,
        description,
        images: [isActiveImage ? file.cdn_url : "/og-image.png"]
      }
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default function FilePage({ params }: FilePageProps) {
  return <FileDetail id={params.id} />;
}
