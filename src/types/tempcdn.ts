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
 * A single API key as returned by GET /api/v1/admin/api-keys (or, on
 * creation, embedded in CreateApiKeyResponse). The plaintext key itself is
 * never included here - only in CreateApiKeyResponse, once, right after
 * creation.
 */
export interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
}

/** Response body from POST /api/v1/admin/api-keys. */
export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

/**
 * Runtime-configurable upload limits, as returned by
 * GET /api/v1/admin/upload-settings and accepted by
 * PUT /api/v1/admin/upload-settings. Unlike TempCdnConfig (the public,
 * read-only /api/v1/config mirror of these same values), this shape
 * includes the audit fields (updated_at/updated_by) only visible to an
 * authenticated admin.
 */
export interface UploadSettings {
  max_upload_size_mb: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
  updated_at: string;
  /**
   * Admin ID who last changed these settings via PUT. Omitted if the row
   * still holds its original boot-time seed (from SERVER_MAX_UPLOAD_MB /
   * ALLOWED_MIME_TYPES / BLOCKED_EXTENSIONS) and has never been changed
   * since.
   */
  updated_by?: string;
}

/** Request body for PUT /api/v1/admin/upload-settings. All fields required — see UploadSettings. */
export interface UpdateUploadSettingsRequest {
  max_upload_size_mb: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
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
