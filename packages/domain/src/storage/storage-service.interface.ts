export interface PresignedUrlSet {
  /** Default URL (public endpoint when configured, otherwise primary). */
  url: string;
  /** LAN-reachable URL when STORAGE_LAN_ENDPOINT is configured. */
  lanUrl?: string;
  /** Remote-reachable URL when STORAGE_PUBLIC_ENDPOINT is configured. */
  publicUrl?: string;
}

export interface PresignedUploadUrl extends PresignedUrlSet {
  key: string;
  expiresAt: Date;
}

export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}

export interface PresignedDownloadOptions {
  key: string;
  expiresInSeconds?: number;
  fileName?: string;
}

export interface PutObjectOptions {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface GetObjectOptions {
  key: string;
  /** When set, only the first N bytes are fetched (Range request). */
  maxBytes?: number;
}

/**
 * Storage abstraction — business logic must depend on this interface only.
 * Implementations: S3StorageService (R2, MinIO, future B2/GCS).
 */
export interface StorageService {
  getPresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<PresignedUploadUrl>;

  getPresignedDownloadUrl(options: PresignedDownloadOptions): Promise<string>;

  getPresignedDownloadUrls(
    options: PresignedDownloadOptions,
  ): Promise<PresignedUrlSet>;

  getObjectBuffer(options: GetObjectOptions): Promise<Buffer>;

  putObject(options: PutObjectOptions): Promise<void>;

  deleteObject(key: string): Promise<void>;

  objectExists(key: string): Promise<boolean>;
}

export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");

export function buildMediaOriginalKey(
  env: string,
  eventId: string,
  mediaId: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  return `${env}/events/${eventId}/originals/${mediaId}.${ext}`;
}

export function buildMediaVariantKey(
  env: string,
  eventId: string,
  mediaId: string,
  variant: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  return `${env}/events/${eventId}/images/${mediaId}/${variant}.${ext}`;
}
