import { parseError } from "./errors";
import { fetchWithFailover } from "./http";

export interface TempCdnStats {
  activeFileCount: number;
  activeBytes: number;
  averageFileBytes: number;
  contentTypeBreakdown: Record<string, number>;
  uploadsTotal: number;
  uploadBytesTotal: number;
  uploadErrorsTotal: number;
  generatedAt: string;
}

export async function getTempCdnStats(): Promise<TempCdnStats> {
  const res = await fetchWithFailover("/stats", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  const body = await res.json();

  return {
    activeFileCount: body?.active_file_count ?? 0,
    activeBytes: body?.active_bytes ?? 0,
    averageFileBytes: body?.average_file_bytes ?? 0,
    contentTypeBreakdown: body?.content_type_breakdown ?? {},
    uploadsTotal: body?.lifetime_uploads_total ?? 0,
    uploadBytesTotal: body?.lifetime_upload_bytes_total ?? 0,
    uploadErrorsTotal: body?.lifetime_upload_errors_total ?? 0,
    generatedAt: body?.generated_at ?? ""
  };
}
