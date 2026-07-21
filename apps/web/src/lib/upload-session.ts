import { ALLOWED_PHOTO_MIME_TYPES, MVP_DEFAULTS } from "@memopics/shared";

import { inferPhotoContentType, randomId } from "./utils";

export type UploadFileState = {
  clientFileId: string;
  file: File;
  status: "pending" | "uploading" | "done" | "failed";
  progress: number;
  mediaId?: string;
  error?: string;
};

export type PersistedUploadSession = {
  uploadSessionId: string;
  batchId?: string;
  files: {
    clientFileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    status: UploadFileState["status"];
    progress: number;
    mediaId?: string;
    error?: string;
  }[];
};

const SESSION_PREFIX = "memopics_upload_";

export function createUploadSessionId(): string {
  return randomId();
}

export function getUploadSessionKey(slug: string): string {
  return `${SESSION_PREFIX}${slug}`;
}

export function loadUploadSession(slug: string): PersistedUploadSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(getUploadSessionKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedUploadSession;
  } catch {
    return null;
  }
}

export function saveUploadSession(
  slug: string,
  session: PersistedUploadSession,
): void {
  sessionStorage.setItem(getUploadSessionKey(slug), JSON.stringify(session));
}

export function clearUploadSession(slug: string): void {
  sessionStorage.removeItem(getUploadSessionKey(slug));
}

export function isAllowedPhotoFile(file: File): boolean {
  if (file.size > MVP_DEFAULTS.MAX_PHOTO_SIZE_BYTES) return false;
  const mime = inferPhotoContentType(file);
  return ALLOWED_PHOTO_MIME_TYPES.includes(
    mime as (typeof ALLOWED_PHOTO_MIME_TYPES)[number],
  );
}

export const MAX_PHOTOS_PER_BATCH = MVP_DEFAULTS.MAX_PHOTOS_PER_BATCH;
export const MAX_PHOTO_SIZE_MB =
  MVP_DEFAULTS.MAX_PHOTO_SIZE_BYTES / (1024 * 1024);
