import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEventTitle,
  buildPublicEventUrl,
  normalizeEventSlug,
  validateEventSlug,
} from "./event.utils";

describe("validateEventSlug", () => {
  it("accepts demetris-daniella", () => {
    const result = validateEventSlug("demetris-daniella");
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "demetris-daniella");
  });

  it("normalizes spaces and case", () => {
    const result = validateEventSlug("Demetris & Daniella");
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "demetris-daniella");
  });

  it("rejects reserved slugs", () => {
    const result = validateEventSlug("admin");
    assert.equal(result.valid, false);
  });

  it("rejects too short slugs", () => {
    const result = validateEventSlug("ab");
    assert.equal(result.valid, false);
  });

  it("strips invalid characters", () => {
    const result = validateEventSlug("hello@world!#");
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "helloworld");
  });

  it("rejects slugs that normalize to too short", () => {
    const result = validateEventSlug("@#");
    assert.equal(result.valid, false);
  });

  it("rejects slugs over max length", () => {
    const result = validateEventSlug("a".repeat(61));
    assert.equal(result.valid, false);
  });
});

describe("buildEventTitle", () => {
  it("joins groom and bride names", () => {
    assert.equal(buildEventTitle("Daniella", "Demetris"), "Demetris & Daniella");
  });
});

describe("buildPublicEventUrl", () => {
  it("builds memopics.com style URL", () => {
    assert.equal(
      buildPublicEventUrl("https://memopics.com", "demetris-daniella"),
      "https://memopics.com/demetris-daniella",
    );
  });

  it("strips trailing slash from base URL", () => {
    assert.equal(
      buildPublicEventUrl("https://memopics.com/", "demetris-daniella"),
      "https://memopics.com/demetris-daniella",
    );
  });

  it("supports custom domain base URLs", () => {
    assert.equal(
      buildPublicEventUrl("https://photos.example.com", "demetris-daniella"),
      "https://photos.example.com/demetris-daniella",
    );
  });
});

describe("normalizeEventSlug", () => {
  it("matches validate normalization", () => {
    assert.equal(normalizeEventSlug("  Demetris--Daniella  "), "demetris-daniella");
  });
});
