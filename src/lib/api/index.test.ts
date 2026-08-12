import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getTempCdnStats,
  getConfig,
  getFileInfo,
  deleteFile,
  getUploadSettings,
  updateUploadSettings,
  TempCdnError
} from "./index";

function nodesResponse(
  nodes: Array<{ node_id: string; status: string }>,
  generatedAt = "2026-08-10T22:37:43Z"
) {
  return {
    nodes: nodes.map((n) => ({
      node_id: n.node_id,
      hostname: `srv-${n.node_id}-hibernate-xxxx`,
      status: n.status,
      started_at: "2026-08-10T22:35:28Z",
      last_heartbeat_at: "2026-08-10T22:37:43Z",
      seconds_since_heartbeat: 0.5
    })),
    generated_at: generatedAt
  };
}

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

describe("getUploadSettings", () => {
  it("sends the admin bearer token and returns the parsed settings", async () => {
    const body = {
      max_upload_size_mb: 100,
      allowed_mime_types: ["image/*"],
      blocked_extensions: [".exe"],
      updated_at: "2026-08-11T09:00:00Z"
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getUploadSettings("session-token");

    expect(result).toEqual(body);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/admin/upload-settings");
    expect(init.headers).toMatchObject({ Authorization: "Bearer session-token" });
  });

  it("throws a TempCdnError on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401))
    );

    await expect(getUploadSettings("bad-token")).rejects.toMatchObject({
      status: 401,
      message: "unauthorized"
    });
  });
});

describe("updateUploadSettings", () => {
  it("PUTs the given settings with the admin bearer token", async () => {
    const responseBody = {
      max_upload_size_mb: 250,
      allowed_mime_types: ["image/*", "application/pdf"],
      blocked_extensions: [".exe", ".bat"],
      updated_at: "2026-08-12T10:00:00Z",
      updated_by: "admin-id-123"
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      max_upload_size_mb: 250,
      allowed_mime_types: ["image/*", "application/pdf"],
      blocked_extensions: [".exe", ".bat"]
    };
    const result = await updateUploadSettings("session-token", input);

    expect(result).toEqual(responseBody);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/admin/upload-settings");
    expect(init.method).toBe("PUT");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer session-token"
    });
    expect(JSON.parse(init.body)).toEqual(input);
  });

  it("surfaces the server's validation message on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "invalid upload settings: max_upload_size_mb must be positive" }, 400)
      )
    );

    await expect(
      updateUploadSettings("session-token", {
        max_upload_size_mb: 0,
        allowed_mime_types: ["image/*"],
        blocked_extensions: []
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "invalid upload settings: max_upload_size_mb must be positive"
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

  async function loadApiWithBases(basesCsv: string) {
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASES", basesCsv);
    vi.resetModules();
    return import("./api");
  }

  it("parses the comma-separated env var, trimming whitespace and trailing slashes", async () => {
    const api = await loadApiWithBases(" https://srv1.tempcdn.eu.cc/api/v1/ , https://srv2.tempcdn.eu.cc/api/v1 ");
    const resolved = await api.getApiBases();
    expect(resolved).toEqual([
      "https://srv1.tempcdn.eu.cc/api/v1",
      "https://srv2.tempcdn.eu.cc/api/v1"
    ]);
    expect(resolved[0]).toBe("https://srv1.tempcdn.eu.cc/api/v1");
  });

  it("rotates the starting base across successive calls", async () => {
    const api = await loadApiWithBases(bases.join(","));
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal("fetch", fetchMock);

    await api.getConfig();
    await api.getConfig();
    await api.getConfig();
    await api.getConfig();

    const calledUrls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(calledUrls[0]).toContain("srv1.tempcdn.eu.cc");
    expect(calledUrls[1]).toContain("srv2.tempcdn.eu.cc");
    expect(calledUrls[2]).toContain("srv3.tempcdn.eu.cc");
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
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse({ error: "down" }, 503)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.getConfig()).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(bases.length);
  });

  it("falls back to the single NEXT_PUBLIC_TEMPCDN_API_BASE when the multi-base var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASES", "");
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_API_BASE", "https://solo.tempcdn.eu.cc/api/v1");
    vi.resetModules();
    const api = await import("./api");

    expect(await api.getApiBases()).toEqual(["https://solo.tempcdn.eu.cc/api/v1"]);
  });
});

describe("dynamic node discovery via NEXT_PUBLIC_TEMPCDN_DOMAIN", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadApiWithDomain(domain: string, bootstrapNode = "srv1") {
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_DOMAIN", domain);
    vi.stubEnv("NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE", bootstrapNode);
    vi.resetModules();
    return import("./api");
  }

  it("bootstraps against the seed node and derives bases from node_id + domain", async () => {
    const api = await loadApiWithDomain("productiondomain.com");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        nodesResponse([
          { node_id: "srv3", status: "online" },
          { node_id: "srv1", status: "online" },
          { node_id: "srv4", status: "online" },
          { node_id: "srv2", status: "online" }
        ])
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const bases = await api.getApiBases();

    expect(fetchMock.mock.calls[0][0]).toBe("https://srv1.productiondomain.com/api/v1/nodes");
    expect(bases).toEqual(
      expect.arrayContaining([
        "https://srv1.productiondomain.com/api/v1",
        "https://srv2.productiondomain.com/api/v1",
        "https://srv3.productiondomain.com/api/v1",
        "https://srv4.productiondomain.com/api/v1"
      ])
    );
    expect(bases).toHaveLength(4);
  });

  it("excludes offline nodes from the derived base list", async () => {
    const api = await loadApiWithDomain("productiondomain.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          nodesResponse([
            { node_id: "srv1", status: "online" },
            { node_id: "srv2", status: "offline" }
          ])
        )
      )
    );

    const bases = await api.getApiBases();

    expect(bases).toEqual(["https://srv1.productiondomain.com/api/v1"]);
  });

  it("tries the next well-known seed node if the first seed is unreachable", async () => {
    const api = await loadApiWithDomain("productiondomain.com");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(
        jsonResponse(nodesResponse([{ node_id: "srv2", status: "online" }]))
      );
    vi.stubGlobal("fetch", fetchMock);

    const bases = await api.getApiBases();

    expect(fetchMock.mock.calls[0][0]).toBe("https://srv1.productiondomain.com/api/v1/nodes");
    expect(fetchMock.mock.calls[1][0]).toBe("https://srv2.productiondomain.com/api/v1/nodes");
    expect(bases).toEqual(["https://srv2.productiondomain.com/api/v1"]);
  });

  it("caches the discovered node list across calls within the TTL", async () => {
    const api = await loadApiWithDomain("productiondomain.com");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(nodesResponse([{ node_id: "srv1", status: "online" }]))
      )
      .mockImplementation(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal("fetch", fetchMock);

    await api.getConfig();
    await api.getConfig();

    const nodesCalls = fetchMock.mock.calls.filter(([url]) => (url as string).includes("/nodes"));
    expect(nodesCalls).toHaveLength(1);
  });

  it("getNodes() returns the raw cluster node list", async () => {
    const api = await loadApiWithDomain("productiondomain.com");
    const payload = nodesResponse([
      { node_id: "srv1", status: "online" },
      { node_id: "srv2", status: "online" }
    ]);
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(payload))));

    const result = await api.getNodes();

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map((n) => n.node_id)).toEqual(["srv1", "srv2"]);
  });
});
