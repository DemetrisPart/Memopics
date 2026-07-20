import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMediaOriginalKeyForEvent } from "./storage-key.utils";

describe("isMediaOriginalKeyForEvent", () => {
  it("accepts valid event-scoped key", () => {
    assert.equal(
      isMediaOriginalKeyForEvent(
        "production/events/abc-123/originals/media-1.jpg",
        "production",
        "abc-123",
      ),
      true,
    );
  });

  it("rejects another event path", () => {
    assert.equal(
      isMediaOriginalKeyForEvent(
        "production/events/other-event/originals/media-1.jpg",
        "production",
        "abc-123",
      ),
      false,
    );
  });

  it("rejects path traversal", () => {
    assert.equal(
      isMediaOriginalKeyForEvent(
        "production/events/abc-123/originals/../other/file.jpg",
        "production",
        "abc-123",
      ),
      false,
    );
  });
});
