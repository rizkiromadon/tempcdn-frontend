import type { LegalDocument } from "@/types/tempcdn";
import { parseError } from "./errors";
import { fetchWithFailover } from "./http";

export async function getTerms(): Promise<LegalDocument> {
  const res = await fetchWithFailover("/legal/terms", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getPrivacy(): Promise<LegalDocument> {
  const res = await fetchWithFailover("/legal/privacy", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}
