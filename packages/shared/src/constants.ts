/** Default MVP limits — hardcoded until payments (V1). */
export const MVP_DEFAULTS = {
  STORAGE_LIMIT_BYTES: 20 * 1024 * 1024 * 1024, // 20 GB
  MAX_PHOTO_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  MAX_PHOTOS_PER_BATCH: 20,
  MAX_PHOTOS_PER_GUEST_SESSION_HOUR: 50,
  PRESIGNED_UPLOAD_TTL_SECONDS: 900, // 15 min
  PRESIGNED_DOWNLOAD_TTL_SECONDS: 3600, // 1 hr
  GUEST_SESSION_TTL_HOURS: 24,
} as const;

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

export const LOG_CATEGORIES = {
  REQUEST: "request",
  UPLOAD: "upload",
  WORKER: "worker",
  AUTH: "auth",
  METRICS: "metrics",
} as const;

export type LogCategory =
  (typeof LOG_CATEGORIES)[keyof typeof LOG_CATEGORIES];
