import { NextResponse } from "next/server";

const ACCESS_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? "memopics_access";
const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE ?? "memopics_refresh";

export function applyAuthTokensToResponse(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

/**
 * Sets auth cookies then navigates with a relative URL only.
 * Avoids Safari iOS errors from absolute redirects to localhost/0.0.0.0.
 */
export function authSuccessHtmlResponse(tokens: {
  accessToken: string;
  refreshToken: string;
}): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Signing in…</title>
  <meta http-equiv="refresh" content="0;url=/dashboard"/>
  <script>window.location.replace("/dashboard")</script>
</head>
<body>
  <p style="font-family:system-ui,sans-serif;text-align:center;margin-top:40vh;color:#666">
    Signing you in… <a href="/dashboard">Continue</a>
  </p>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  applyAuthTokensToResponse(response, tokens);
  return response;
}
