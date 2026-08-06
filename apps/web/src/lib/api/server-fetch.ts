import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, CoupleEvent } from "./types";
import { ApiError } from "./types";

async function serverApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = process.env.API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(`${base}/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function requireAuth(): Promise<AuthUser> {
  try {
    return await serverApiFetch<AuthUser>("/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/auth/login");
    }
    throw err;
  }
}

export async function fetchEventsServer(): Promise<CoupleEvent[]> {
  return serverApiFetch<CoupleEvent[]>("/events");
}

export async function fetchEventServer(eventId: string): Promise<CoupleEvent> {
  return serverApiFetch<CoupleEvent>(`/events/${encodeURIComponent(eventId)}`);
}

export async function fetchEventStatsServer(eventId: string) {
  return serverApiFetch(`/events/${encodeURIComponent(eventId)}/stats`);
}

export async function fetchEventQrServer(eventId: string) {
  return serverApiFetch(`/events/${encodeURIComponent(eventId)}/qr`);
}

export async function fetchPublicEventQrServer(slug: string) {
  return serverApiFetch(`/public/events/${encodeURIComponent(slug)}/qr`);
}

export async function fetchCoupleGalleryServer(
  eventId: string,
  limit = 10,
) {
  return serverApiFetch(
    `/events/${encodeURIComponent(eventId)}/media?limit=${limit}`,
  );
}
