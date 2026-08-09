export interface UploadedFile {
  id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  checksum_sha256: string;
  object_key: string;
  cdn_url: string;
  created_at: string;
  expires_at: string;
  duplicate?: boolean;
  expired?: boolean;
}

export interface ApiError {
  error: string;
}

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadTask {
  clientId: string;
  file: File;
  status: UploadStatus;
  progress: number;
  result?: UploadedFile;
  error?: string;
}
