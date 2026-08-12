// Public entry point for the TempCDN API client.
// Re-exports everything so existing `@/lib/api` imports keep working
// while the implementation lives in smaller, focused modules below.

export { TempCdnError } from "./errors";
export { getApiBases, invalidateNodesCache } from "./nodes";
export { uploadFile } from "./upload";
export { getConfig, getFileInfo, deleteFile, checkHealth, getNodes } from "./files";
export { getTempCdnStats, type TempCdnStats } from "./stats";
export {
  adminLogin,
  adminLogout,
  adminMe,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getUploadSettings,
  updateUploadSettings
} from "./admin";
