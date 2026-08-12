import type {
  AdminLoginResponse,
  AdminMeResponse,
  ApiKey,
  CreateApiKeyResponse,
  UploadSettings,
  UpdateUploadSettingsRequest,
  LegalDocument,
  UpdateLegalDocumentRequest
} from "@/types/tempcdn";
import { parseError } from "./errors";
import { fetchWithFailover } from "./http";

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetchWithFailover("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (res.status === 401) {
    return parseError(res, "Invalid username or password.");
  }
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function adminLogout(token: string): Promise<void> {
  const res = await fetchWithFailover("/admin/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return parseError(res);
}

export async function adminMe(token: string): Promise<AdminMeResponse> {
  const res = await fetchWithFailover("/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function createApiKey(token: string, name: string): Promise<CreateApiKeyResponse> {
  const res = await fetchWithFailover("/admin/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function listApiKeys(token: string): Promise<ApiKey[]> {
  const res = await fetchWithFailover("/admin/api-keys", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function revokeApiKey(token: string, id: string): Promise<void> {
  const res = await fetchWithFailover(`/admin/api-keys/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return parseError(res);
}

export async function getUploadSettings(token: string): Promise<UploadSettings> {
  const res = await fetchWithFailover("/admin/upload-settings", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateUploadSettings(
  token: string,
  input: UpdateUploadSettingsRequest
): Promise<UploadSettings> {
  const res = await fetchWithFailover("/admin/upload-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getAdminTerms(token: string): Promise<LegalDocument> {
  const res = await fetchWithFailover("/admin/legal/terms", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateAdminTerms(
  token: string,
  input: UpdateLegalDocumentRequest
): Promise<LegalDocument> {
  const res = await fetchWithFailover("/admin/legal/terms", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getAdminPrivacy(token: string): Promise<LegalDocument> {
  const res = await fetchWithFailover("/admin/legal/privacy", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateAdminPrivacy(
  token: string,
  input: UpdateLegalDocumentRequest
): Promise<LegalDocument> {
  const res = await fetchWithFailover("/admin/legal/privacy", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
