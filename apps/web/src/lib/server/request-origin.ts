import type { NextRequest } from "next/server";

/** Origin as seen by the client (Host header), not the internal bind address. */
export function getRequestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (request.nextUrl.protocol.replace(":", "") || "http");
    return `${proto}://${host}`;
  }

  const origin = request.nextUrl.origin;
  if (!origin.includes("0.0.0.0") && !origin.includes("127.0.0.1")) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore malformed referer
    }
  }

  return origin;
}

export function getRequestPathUrl(
  request: NextRequest,
  pathname: string,
): URL {
  return new URL(pathname, getRequestOrigin(request));
}
