/** Slugs that must not be used as event URLs (app routes + reserved). */
export const RESERVED_EVENT_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "pricing",
  "health",
  "login",
  "register",
  "verify",
  "me",
  "events",
  "public",
  "static",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/** memopics.com/demetris-daniella */
export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EVENT_SLUG_MIN_LENGTH = 3;
export const EVENT_SLUG_MAX_LENGTH = 60;

export interface SlugValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function normalizeEventSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateEventSlug(input: string): SlugValidationResult {
  const normalized = normalizeEventSlug(input);

  if (normalized.length < EVENT_SLUG_MIN_LENGTH) {
    return {
      valid: false,
      error: `URL must be at least ${EVENT_SLUG_MIN_LENGTH} characters`,
    };
  }

  if (normalized.length > EVENT_SLUG_MAX_LENGTH) {
    return {
      valid: false,
      error: `URL must be at most ${EVENT_SLUG_MAX_LENGTH} characters`,
    };
  }

  if (!EVENT_SLUG_PATTERN.test(normalized)) {
    return {
      valid: false,
      error:
        "URL may only contain lowercase letters, numbers, and hyphens (no leading or trailing hyphen)",
    };
  }

  if (RESERVED_EVENT_SLUGS.has(normalized)) {
    return {
      valid: false,
      error: "This URL is reserved and cannot be used",
    };
  }

  return { valid: true, normalized };
}

export function buildEventTitle(
  brideName?: string | null,
  groomName?: string | null,
  fallback = "Our Event",
): string {
  const bride = brideName?.trim();
  const groom = groomName?.trim();

  if (bride && groom) return `${bride} & ${groom}`;
  if (bride) return bride;
  if (groom) return groom;
  return fallback;
}

export function buildPublicEventUrl(baseUrl: string, slug: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/${slug}`;
}

export function extensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[mimeType] ?? "jpg";
}
