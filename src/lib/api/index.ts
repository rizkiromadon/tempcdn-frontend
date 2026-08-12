// Public entry point for the TempCDN API client.
// `@/lib/api` resolves here; the implementation lives in the
// smaller, focused modules below.

export { TempCdnError } from "./errors";
export { getApiBases, invalidateNodesCache } from "./nodes";
export { uploadFile } from "./upload";
export { getConfig, getFileInfo, deleteFile, checkHealth, getNodes } from "./files";
export { getTempCdnStats, type TempCdnStats } from "./stats";
export { getTerms, getPrivacy } from "./legal";
export {
  adminLogin,
  adminLogout,
  adminMe,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getUploadSettings,
  updateUploadSettings,
  getAdminTerms,
  updateAdminTerms,
  getAdminPrivacy,
  updateAdminPrivacy
} from "./admin";
