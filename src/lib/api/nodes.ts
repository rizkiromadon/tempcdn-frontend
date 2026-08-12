import type { NodesResponse } from "@/types/tempcdn";

const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_TEMPCDN_DOMAIN?.trim().replace(/\/+$/, "");
const BOOTSTRAP_NODE_IDS: readonly string[] = (
  process.env.NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE?.trim() || "srv1"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)
  .concat(["srv2", "srv3", "srv4", "srv5", "srv6"]);

function nodeBase(nodeId: string): string {
  return `https://${nodeId}.${PRODUCTION_DOMAIN}/api/v1`;
}

const STATIC_BASES: readonly string[] = (() => {
  const multi = process.env.NEXT_PUBLIC_TEMPCDN_API_BASES;
  if (multi && multi.trim() !== "") {
    const bases = multi
      .split(",")
      .map((base) => base.trim().replace(/\/+$/, ""))
      .filter((base) => base !== "");
    if (bases.length > 0) return bases;
  }
  const single = process.env.NEXT_PUBLIC_TEMPCDN_API_BASE ?? "http://localhost:8080/api/v1";
  return [single.replace(/\/+$/, "")];
})();

const NODES_CACHE_TTL_MS = 30_000;
const NODES_TIMEOUT_MS = 5_000;

let cachedOnlineBases: readonly string[] | null = null;
let cacheExpiresAt = 0;
let discoveryInFlight: Promise<readonly string[]> | null = null;

async function fetchNodesFrom(base: string): Promise<readonly string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NODES_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/nodes`, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`nodes discovery failed with status ${res.status}`);
    const body = (await res.json()) as NodesResponse;
    const online = (body.nodes ?? [])
      .filter((n) => n.status === "online")
      .map((n) => nodeBase(n.node_id));
    if (online.length === 0) throw new Error("nodes discovery returned no online nodes");
    return online;
  } finally {
    clearTimeout(timer);
  }
}

async function discoverNodes(): Promise<readonly string[]> {
  let lastError: unknown;
  for (const seedId of BOOTSTRAP_NODE_IDS) {
    try {
      return await fetchNodesFrom(nodeBase(seedId));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("node discovery failed");
}

async function getOnlineBases(): Promise<readonly string[]> {
  if (!PRODUCTION_DOMAIN) return STATIC_BASES;

  const now = Date.now();
  if (cachedOnlineBases && now < cacheExpiresAt) return cachedOnlineBases;

  if (!discoveryInFlight) {
    discoveryInFlight = discoverNodes()
      .then((bases) => {
        cachedOnlineBases = bases;
        cacheExpiresAt = Date.now() + NODES_CACHE_TTL_MS;
        return bases;
      })
      .catch((err) => {
        if (cachedOnlineBases) return cachedOnlineBases;
        throw err;
      })
      .finally(() => {
        discoveryInFlight = null;
      });
  }
  return discoveryInFlight;
}

export async function getApiBases(): Promise<readonly string[]> {
  return getOnlineBases();
}

export function invalidateNodesCache(): void {
  cachedOnlineBases = null;
  cacheExpiresAt = 0;
}

let rotationCursor = 0;
function rotate(bases: readonly string[]): readonly string[] {
  if (bases.length === 0) return bases;
  const start = rotationCursor % bases.length;
  rotationCursor = (rotationCursor + 1) % bases.length;
  if (start === 0) return bases;
  return [...bases.slice(start), ...bases.slice(0, start)];
}

export async function nextBaseOrder(): Promise<readonly string[]> {
  const bases = await getOnlineBases();
  return rotate(bases);
}
