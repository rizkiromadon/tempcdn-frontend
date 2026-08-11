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
  /**
   * One-time secret returned only in the /upload response, used to
   * authorize DELETE /api/v1/files/{id}. Never returned by GET
   * /api/v1/files/{id} — if this is undefined (e.g. the file was loaded
   * via lookup rather than just uploaded, or it predates the delete-token
   * rollout), the file can no longer be deleted manually and will only
   * disappear when its TTL expires.
   */
  delete_token?: string;
}

export interface ApiError {
  error: string;
}

export interface TempCdnConfig {
  max_upload_size_bytes: number;
  max_upload_size_mb: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
  file_ttl_hours: number;
}

export interface NodeInfo {
  node_id: string;
  hostname: string;
  status: "online" | "offline" | string;
  started_at: string;
  last_heartbeat_at: string;
  seconds_since_heartbeat: number;
}

export interface NodesResponse {
  nodes: NodeInfo[];
  generated_at: string;
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

/** Response body from POST /api/v1/admin/login. */
export interface AdminLoginResponse {
  token: string;
  username: string;
  expires_at: string;
}

/** Response body from GET /api/v1/admin/me. */
export interface AdminMeResponse {
  username: string;
}

/**
 * Admin session persisted in this browser (see lib/admin-auth.ts). Mirrors
 * AdminLoginResponse but named separately since this is our stored shape,
 * not necessarily identical to whatever the API returns in the future.
 */
export interface AdminSession {
  token: string;
  username: string;
  expiresAt: string;
}
