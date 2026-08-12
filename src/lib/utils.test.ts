import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatCountdown,
  truncateMiddle,
  validateFileAgainstConfig,
  fractionRemaining,
  getFileKind,
  isPreviewable,
  type FileValidationConfig
} from "./utils";

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats sub-KB values as whole bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats exactly at the KB boundary", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats exactly at the MB boundary", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });

  it("formats exactly at the GB boundary", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it("formats exactly at the TB boundary (regression for task 0.3)", () => {
    expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
  });

  it("never produces 'undefined' or NaN for very large values", () => {
    const veryLarge = 1024 ** 6;
    const result = formatBytes(veryLarge);
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("NaN");
    expect(result.endsWith("PB")).toBe(true);
  });

  it("formats at the PB boundary", () => {
    expect(formatBytes(1024 ** 5)).toBe("1.0 PB");
  });
});

describe("formatCountdown", () => {
  it("returns 'expired' for zero or negative durations", () => {
    expect(formatCountdown(0)).toBe("expired");
    expect(formatCountdown(-1000)).toBe("expired");
  });

  it("formats seconds only", () => {
    expect(formatCountdown(5000)).toBe("00:00:05");
  });

  it("formats minutes and seconds", () => {
    expect(formatCountdown(90_000)).toBe("00:01:30");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatCountdown(3_661_000)).toBe("01:01:01");
  });
});

describe("truncateMiddle", () => {
  it("returns short strings unchanged", () => {
    expect(truncateMiddle("short.txt")).toBe("short.txt");
  });

  it("truncates long strings with an ellipsis in the middle", () => {
    const long = "abcdefghijklmnopqrstuvwxyz";
    const result = truncateMiddle(long, 8, 6);
    expect(result).toBe("abcdefgh...uvwxyz");
  });

  it("respects custom front/back lengths", () => {
    const long = "0123456789abcdefghij";
    expect(truncateMiddle(long, 3, 3)).toBe("012...hij");
  });
});

describe("getFileKind", () => {
  it("detects images", () => {
    expect(getFileKind("image/png")).toBe("image");
    expect(getFileKind("image/jpeg")).toBe("image");
  });

  it("detects video and audio", () => {
    expect(getFileKind("video/mp4")).toBe("video");
    expect(getFileKind("audio/mpeg")).toBe("audio");
  });

  it("detects pdf", () => {
    expect(getFileKind("application/pdf")).toBe("pdf");
  });

  it("detects text-like types", () => {
    expect(getFileKind("text/plain")).toBe("text");
    expect(getFileKind("application/json")).toBe("text");
    expect(getFileKind("application/xml")).toBe("text");
  });

  it("detects archives", () => {
    expect(getFileKind("application/zip")).toBe("archive");
    expect(getFileKind("application/x-tar")).toBe("archive");
    expect(getFileKind("application/x-7z-compressed")).toBe("archive");
  });

  it("falls back to 'other' for unrecognized types", () => {
    expect(getFileKind("application/octet-stream")).toBe("other");
  });
});

describe("isPreviewable", () => {
  it("is true only for images", () => {
    expect(isPreviewable("image/png")).toBe(true);
    expect(isPreviewable("video/mp4")).toBe(false);
    expect(isPreviewable("application/pdf")).toBe(false);
  });
});

describe("validateFileAgainstConfig", () => {
  const baseConfig: FileValidationConfig = {
    max_upload_size_bytes: 1024,
    allowed_mime_types: [],
    blocked_extensions: []
  };

  function makeFile(name: string, size: number, type: string): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it("accepts a file within limits", () => {
    const file = makeFile("photo.png", 512, "image/png");
    expect(validateFileAgainstConfig(file, baseConfig)).toEqual({ valid: true });
  });

  it("rejects a file exceeding max size", () => {
    const file = makeFile("big.bin", 2048, "application/octet-stream");
    const result = validateFileAgainstConfig(file, baseConfig);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("1.0 KB");
  });

  it("rejects a blocked extension", () => {
    const file = makeFile("virus.exe", 100, "application/octet-stream");
    const result = validateFileAgainstConfig(file, {
      ...baseConfig,
      blocked_extensions: [".exe"]
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain(".exe");
  });

  it("is case-insensitive for blocked extensions", () => {
    const file = makeFile("VIRUS.EXE", 100, "application/octet-stream");
    const result = validateFileAgainstConfig(file, {
      ...baseConfig,
      blocked_extensions: [".exe"]
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a mime type not in the allow-list", () => {
    const file = makeFile("script.js", 100, "application/javascript");
    const result = validateFileAgainstConfig(file, {
      ...baseConfig,
      allowed_mime_types: ["image/png", "image/jpeg"]
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("application/javascript");
  });

  it("accepts a mime type matching a wildcard pattern", () => {
    const file = makeFile("photo.png", 100, "image/png");
    const result = validateFileAgainstConfig(file, {
      ...baseConfig,
      allowed_mime_types: ["image/*"]
    });
    expect(result.valid).toBe(true);
  });

  it("skips mime validation when the browser reports an empty file.type", () => {
    const file = makeFile("mystery", 100, "");
    const result = validateFileAgainstConfig(file, {
      ...baseConfig,
      allowed_mime_types: ["image/png"]
    });
    expect(result.valid).toBe(true);
  });
});

describe("fractionRemaining", () => {
  it("returns 1 right at creation time", () => {
    const created = "2026-01-01T00:00:00Z";
    const expires = "2026-01-02T00:00:00Z";
    const now = new Date(created).getTime();
    expect(fractionRemaining(created, expires, now)).toBeCloseTo(1, 5);
  });

  it("returns 0 once fully expired", () => {
    const created = "2026-01-01T00:00:00Z";
    const expires = "2026-01-02T00:00:00Z";
    const now = new Date(expires).getTime() + 1000;
    expect(fractionRemaining(created, expires, now)).toBe(0);
  });

  it("returns ~0.5 halfway through the TTL", () => {
    const created = "2026-01-01T00:00:00Z";
    const expires = "2026-01-02T00:00:00Z";
    const now = new Date(created).getTime() + 12 * 60 * 60 * 1000;
    expect(fractionRemaining(created, expires, now)).toBeCloseTo(0.5, 5);
  });

  it("clamps to 0 when total duration is non-positive", () => {
    const created = "2026-01-02T00:00:00Z";
    const expires = "2026-01-01T00:00:00Z";
    expect(fractionRemaining(created, expires)).toBe(0);
  });
});
