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

export interface AdminLoginResponse {
  token: string;
  username: string;
  expires_at: string;
}

export interface AdminMeResponse {
  username: string;
}

export interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

export interface UploadSettings {
  max_upload_size_mb: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
  updated_at: string;
  updated_by?: string;
}

export interface UpdateUploadSettingsRequest {
  max_upload_size_mb: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
}

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: string;
}
