import { type NextRequest, NextResponse } from "next/server";
import { applyAuthTokensToResponse } from "@/lib/server/set-auth-cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sets auth cookies from tokens already issued by the API.
 * Used when Mobile Preview / iframes block Set-Cookie on the finish response
 * — the top window posts tokens here as a first-party request.
 */
export async function POST(request: NextRequest) {
  let body: { accessToken?: string; refreshToken?: string };
  try {
    body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const accessToken = body.accessToken?.trim();
  const refreshToken = body.refreshToken?.trim();
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Tokens required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  applyAuthTokensToResponse(response, { accessToken, refreshToken });
  return response;
}
