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
      // Don't expose details of a file that no longer exists — fall back to
      // generic metadata rather than describing something that's gone.
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
      // Ephemeral, per-upload content — never worth indexing since the
      // underlying file (and this URL's relevance) disappears on expiry.
      robots: { index: false, follow: true },
      openGraph: {
        title: file.original_name,
        description,
        type: "website",
        ...(isActiveImage ? { images: [{ url: file.cdn_url }] } : {})
      },
      twitter: {
        card: isActiveImage ? "summary_large_image" : "summary",
        title: file.original_name,
        description,
        ...(isActiveImage ? { images: [file.cdn_url] } : {})
      }
    };
  } catch {
    // 404, network error, timeout, etc. — safe generic fallback either way.
    return FALLBACK_METADATA;
  }
}

export default function FilePage({ params }: FilePageProps) {
  return <FileDetail id={params.id} />;
}
