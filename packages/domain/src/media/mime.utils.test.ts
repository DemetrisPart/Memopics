import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectMimeFromBuffer,
  mimeMatchesDeclared,
} from "./mime.utils";
import { checkStorageQuota } from "./storage-quota.utils";

describe("detectMimeFromBuffer", () => {
  it("detects JPEG magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(detectMimeFromBuffer(buf), "image/jpeg");
  });

  it("detects PNG magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectMimeFromBuffer(buf), "image/png");
  });

  it("returns null for unknown bytes", () => {
    assert.equal(detectMimeFromBuffer(Buffer.from("hello")), null);
  });
});

describe("mimeMatchesDeclared", () => {
  it("accepts matching jpeg", () => {
    assert.equal(
      mimeMatchesDeclared("image/jpeg", "image/jpeg"),
      true,
    );
  });

  it("accepts heic/heif equivalence", () => {
    assert.equal(
      mimeMatchesDeclared("image/heic", "image/heif"),
      true,
    );
  });

  it("rejects mime mismatch", () => {
    assert.equal(
      mimeMatchesDeclared("image/png", "image/jpeg"),
      false,
    );
  });
});

describe("checkStorageQuota", () => {
  it("allows upload within limit", () => {
    const result = checkStorageQuota({
      storageUsedBytes: BigInt(1000),
      storageLimitBytes: BigInt(2000),
      incomingBytes: BigInt(500),
    });
    assert.equal(result.allowed, true);
    assert.equal(result.remainingBytes, BigInt(1000));
  });

  it("rejects upload exceeding limit", () => {
    const result = checkStorageQuota({
      storageUsedBytes: BigInt(1900),
      storageLimitBytes: BigInt(2000),
      incomingBytes: BigInt(200),
    });
    assert.equal(result.allowed, false);
    assert.equal(result.wouldExceedBy, BigInt(100));
  });
});
