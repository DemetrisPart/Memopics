import { type NextRequest, NextResponse } from "next/server";
import { authSuccessHtmlResponse } from "@/lib/server/set-auth-cookies";
import { getRequestPathUrl } from "@/lib/server/request-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

/** Full-page sign-in finish via poll token — preferred after email approve. */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("warmup") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  const pollToken = request.nextUrl.searchParams.get("pollToken")?.trim();
  if (!pollToken) {
    return NextResponse.redirect(getRequestPathUrl(request, "/auth/login"));
  }

  const upstream = await fetch(`${API_BASE}/v1/auth/magic-link/complete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pollToken }),
  });

  if (upstream.status === 202) {
    return NextResponse.redirect(getRequestPathUrl(request, "/auth/login"));
  }

  if (!upstream.ok) {
    return NextResponse.redirect(
      getRequestPathUrl(request, "/auth/login?error=sign-in"),
    );
  }

  const body = (await upstream.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!body.accessToken || !body.refreshToken) {
    return NextResponse.redirect(
      getRequestPathUrl(request, "/auth/login?error=session"),
    );
  }

  return authSuccessHtmlResponse({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  });
}
