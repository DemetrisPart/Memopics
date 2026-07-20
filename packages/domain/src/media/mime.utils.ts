const HEIC_MIMES = new Set(["image/heic", "image/heif"]);

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

/** Magic-byte sniffing for allowed photo types (first bytes only). */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 3) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.includes("heic") || brand.includes("heix") || brand.includes("mif1")) {
      return "image/heic";
    }
  }

  return null;
}

export function isAllowedPhotoMimeType(
  mimeType: string,
): mimeType is AllowedPhotoMimeType {
  return (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Declared Content-Type must match detected bytes (HEIC/HEIF treated as equivalent). */
export function mimeMatchesDeclared(
  detected: string | null,
  declared: string,
): boolean {
  if (!detected || !isAllowedPhotoMimeType(declared)) {
    return false;
  }

  if (detected === declared) return true;

  if (HEIC_MIMES.has(detected) && HEIC_MIMES.has(declared)) {
    return true;
  }

  return false;
}
