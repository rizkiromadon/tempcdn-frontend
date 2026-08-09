import { describe, it, expect, vi, afterEach } from "vitest";
import { getTempCdnMetrics, getConfig, getFileInfo, TempCdnError } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getTempCdnMetrics (Prometheus text parser)", () => {
  it("parses unlabeled counters (current backend shape)", async () => {
    const body = [
      "# HELP tempcdn_uploads_total total uploads",
      "# TYPE tempcdn_uploads_total counter",
      "tempcdn_uploads_total 42",
      "tempcdn_upload_bytes_total 123456",
      "tempcdn_upload_errors_total 3"
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(body)));

    const metrics = await getTempCdnMetrics();
    expect(metrics).toEqual({
      uploadsTotal: 42,
      uploadBytesTotal: 123456,
      uploadErrorsTotal: 3
    });
  });

  it("parses labeled counters (regression for task 2.2)", async () => {
    const body = [
      'tempcdn_uploads_total{status="ok"} 42',
      'tempcdn_upload_bytes_total{bucket="default"} 123456',
      'tempcdn_upload_errors_total{status="failed"} 3'
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(body)));

    const metrics = await getTempCdnMetrics();
    expect(metrics).toEqual({
      uploadsTotal: 42,
      uploadBytesTotal: 123456,
      uploadErrorsTotal: 3
    });
  });

  it("handles scientific-notation values", async () => {
    const body = "tempcdn_uploads_total 4.2e+01";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(body)));

    const metrics = await getTempCdnMetrics();
    expect(metrics.uploadsTotal).toBe(42);
  });

  it("defaults missing metrics to 0 rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("# empty\n")));

    const metrics = await getTempCdnMetrics();
    expect(metrics).toEqual({
      uploadsTotal: 0,
      uploadBytesTotal: 0,
      uploadErrorsTotal: 0
    });
  });

  it("does not confuse one metric's value with a similarly-named metric", async () => {
    // tempcdn_uploads_total should not accidentally match
    // tempcdn_uploads_total_by_region or similar prefixed names.
    const body = [
      "tempcdn_uploads_total_by_region 999",
      "tempcdn_uploads_total 42"
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(body)));

    const metrics = await getTempCdnMetrics();
    expect(metrics.uploadsTotal).toBe(42);
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
