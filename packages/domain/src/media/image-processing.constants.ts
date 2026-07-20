/** Sharp output settings — must match worker-media processor. */
export const IMAGE_VARIANT_SPECS = {
  THUMB: {
    maxDimension: 400,
    format: "webp" as const,
    quality: 80,
    extension: "webp",
  },
  WEB: {
    maxDimension: 2048,
    format: "webp" as const,
    quality: 85,
    extension: "webp",
  },
} as const;

/** Bytes read from object storage for magic-byte MIME validation on complete. */
export const MIME_SNIFF_BYTE_LENGTH = 4100;
