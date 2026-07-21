import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * UUID for client-side IDs (upload sessions, file refs).
 * crypto.randomUUID requires a secure context — unavailable on mobile LAN over HTTP.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function inferPhotoContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

export function formatEventDate(isoDate: string): string {
  const dateOnly = isoDate.slice(0, 10);
  const date = new Date(`${dateOnly}T12:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCoupleNames(
  groomName: string | null | undefined,
  brideName: string | null | undefined,
  fallback = "Our Event",
): string {
  const groom = groomName?.trim();
  const bride = brideName?.trim();

  if (groom && bride) return `${groom} & ${bride}`;
  if (groom) return groom;
  if (bride) return bride;
  return fallback;
}

export function formatGuestName(firstName: string, lastName?: string | null): string {
  if (lastName?.trim()) {
    return `${firstName} ${lastName.trim()}`;
  }
  return firstName;
}

export function storageRemainingLabel(
  usedBytes: string,
  limitBytes: string,
): string {
  const remaining = BigInt(limitBytes) - BigInt(usedBytes);
  const gb = Number(remaining) / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB remaining`;
  }
  const mb = Number(remaining) / (1024 * 1024);
  return `${Math.max(0, Math.round(mb))} MB remaining`;
}
