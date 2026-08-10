import { describe, it, expect, vi, afterEach } from "vitest";
import { getTempCdnStats, getConfig, getFileInfo, deleteFile, TempCdnError } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getTempCdnStats (JSON /api/v1/stats)", () => {
  it("maps the documented response shape", async () => {
    const body = {
      active_file_count: 17,
      active_bytes: 3885936,
      average_file_bytes: 228584,
      content_type_breakdown: { application: 1, image: 16 },
      lifetime_uploads_total: 19,
      lifetime_upload_bytes_total: 4479696,
      lifetime_upload_errors_total: 0,
      generated_at: "2026-08-10T09:26:48Z"
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body)));

    const stats = await getTempCdnStats();
    expect(stats).toEqual({
      activeFileCount: 17,
      activeBytes: 3885936,
      averageFileBytes: 228584,
      contentTypeBreakdown: { application: 1, image: 16 },
      uploadsTotal: 19,
      uploadBytesTotal: 4479696,
      uploadErrorsTotal: 0,
      generatedAt: "2026-08-10T09:26:48Z"
    });
  });

  it("defaults missing fields rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));

    const stats = await getTempCdnStats();
    expect(stats).toEqual({
      activeFileCount: 0,
      activeBytes: 0,
      averageFileBytes: 0,
      contentTypeBreakdown: {},
      uploadsTotal: 0,
      uploadBytesTotal: 0,
      uploadErrorsTotal: 0,
      generatedAt: ""
    });
  });

  it("throws a TempCdnError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "stats unavailable" }, 500))
    );

    await expect(getTempCdnStats()).rejects.toMatchObject({
      message: "stats unavailable",
      status: 500
    });
  });

  it("requests the stats endpoint under the versioned API base", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await getTempCdnStats();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/v1/stats");
  });
});

describe("getConfig error handling", () => {
  it("returns parsed config on success", async () => {
    const config = {
      max_upload_size_bytes: 1024,
      max_upload_size_mb: 1,
      allowed_mime_types: [],
      blocked_extensions: [],
      file_ttl_hours: 24
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(config)));

    await expect(getConfig()).resolves.toEqual(config);
  });

  it("throws a TempCdnError with the server's message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "server exploded" }, 500))
    );

    await expect(getConfig()).rejects.toMatchObject({
      message: "server exploded",
      status: 500
    });
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 502 }))
    );

    await expect(getConfig()).rejects.toBeInstanceOf(TempCdnError);
  });
});

describe("getFileInfo 410 handling", () => {
  it("returns the metadata body (not an error) on 410 Gone", async () => {
    const expiredFile = {
      id: "abc123",
      original_name: "old.png",
      content_type: "image/png",
      size_bytes: 100,
      checksum_sha256: "deadbeef",
      object_key: "2026/01/01/abc123.png",
      cdn_url: "https://cdn.example.com/abc123.png",
      created_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-01-02T00:00:00Z",
      expired: true
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(expiredFile, 410)));

    const result = await getFileInfo("abc123");
    expect(result).toEqual(expiredFile);
  });

  it("throws for a genuine 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "not found" }, 404))
    );

    await expect(getFileInfo("missing")).rejects.toMatchObject({ status: 404 });
  });
});

describe("deleteFile", () => {
  it("sends the delete token as the X-Delete-Token header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ deleted: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await deleteFile("abc123", "dt_secret");

    expect(result).toEqual({ deleted: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/files/abc123");
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({ "X-Delete-Token": "dt_secret" });
  });

  it("throws a 403 TempCdnError when the token is missing or invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "invalid delete token" }, 403))
    );

    await expect(deleteFile("abc123", "wrong-token")).rejects.toMatchObject({
      status: 403,
      message: "invalid delete token"
    });
  });

  it("falls back to a helpful message on 403 when the server sends no JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));

    await expect(deleteFile("abc123", "wrong-token")).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("delete token")
    });
  });
});

describe("round-robin + failover across NEXT_PUBLIC_TEMPCDN_API_BASES", () => {
  const bases = [
    "https://srv1.tempcdn.eu.cc/api/v1",
    "https://srv2.tempcdn.eu.cc/api/v1",
    "https://srv3.tempcdn.eu.cc/api/v1"
  ];

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /**
   * Env vars are read once at module load time (see the API_BASES IIFE in
   * api.ts), so each test needs a fresh module instance after stubbing
   * NEXT_PUBLIC_TEMPCDN_API_BASES - vi.resetModules() + a dynamic import
   * achieves that without restructuring api.ts to accept bases as a
   * parameter just for testability.
   */
  async function loadApiWithBases(basesCsv: string) {
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASES", basesCsv);
    vi.resetModules();
    return import("./api");
  }

  it("parses the comma-separated env var, trimming whitespace and trailing slashes", async () => {
    const api = await loadApiWithBases(" https://srv1.tempcdn.eu.cc/api/v1/ , https://srv2.tempcdn.eu.cc/api/v1 ");
    expect(api.API_BASES).toEqual([
      "https://srv1.tempcdn.eu.cc/api/v1",
      "https://srv2.tempcdn.eu.cc/api/v1"
    ]);
    expect(api.API_BASE).toBe("https://srv1.tempcdn.eu.cc/api/v1");
  });

  it("rotates the starting base across successive calls", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await api.getConfig();
    await api.getConfig();
    await api.getConfig();
    await api.getConfig();

    const calledUrls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(calledUrls[0]).toContain("srv1.tempcdn.eu.cc");
    expect(calledUrls[1]).toContain("srv2.tempcdn.eu.cc");
    expect(calledUrls[2]).toContain("srv3.tempcdn.eu.cc");
    // Wraps back around to the first server on the 4th call.
    expect(calledUrls[3]).toContain("srv1.tempcdn.eu.cc");
  });

  it("fails over to the next server on a 500 response", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500))
      .mockResolvedValueOnce(jsonResponse({ max_upload_size_bytes: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const config = await api.getConfig();

    expect(config).toEqual({ max_upload_size_bytes: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("srv1.tempcdn.eu.cc");
    expect(fetchMock.mock.calls[1][0]).toContain("srv2.tempcdn.eu.cc");
  });

  it("fails over to the next server on a network error", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(jsonResponse({ max_upload_size_bytes: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const config = await api.getConfig();

    expect(config).toEqual({ max_upload_size_bytes: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not fail over on a 4xx response - retrying wouldn't change the outcome", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "invalid delete token" }, 403));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.deleteFile("abc123", "wrong-token")).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws the last error once every server has failed", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "down" }, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.getConfig()).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(bases.length);
  });

  it("falls back to the single NEXT_PUBLIC_TEMPCDN_API_BASE when the multi-base var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASES", "");
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASE", "https://solo.tempcdn.eu.cc/api/v1");
    vi.resetModules();
    const api = await import("./api");

    expect(api.API_BASES).toEqual(["https://solo.tempcdn.eu.cc/api/v1"]);
  });
});
