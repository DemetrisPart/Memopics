import { NextRequest, NextResponse } from "next/server";

const MAILPIT =
  process.env.MAILPIT_API_URL ?? "http://localhost:8025/api/v1";

function extractToken(html: string): string | null {
  const match = html.match(/token=([^"&\s<]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Dev only — reads latest magic link from Mailpit for mobile/LAN testing. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  try {
    const listRes = await fetch(`${MAILPIT}/messages`, { cache: "no-store" });
    if (!listRes.ok) {
      return NextResponse.json(
        { error: "Mailpit unavailable — run pnpm docker:up" },
        { status: 503 },
      );
    }

    const list = (await listRes.json()) as {
      messages?: Array<{
        ID: string;
        To?: Array<{ Address?: string }>;
      }>;
    };

    const messages = list.messages ?? [];
    const msg =
      messages.find((m) =>
        m.To?.some((t) => t.Address?.toLowerCase().includes(email)),
      ) ?? messages[0];

    if (!msg) {
      return NextResponse.json(
        { error: "No email in Mailpit yet — tap Send magic link first" },
        { status: 404 },
      );
    }

    const detailRes = await fetch(`${MAILPIT}/message/${msg.ID}`, {
      cache: "no-store",
    });
    if (!detailRes.ok) {
      return NextResponse.json(
        { error: "Could not read Mailpit message" },
        { status: 502 },
      );
    }

    const detail = (await detailRes.json()) as { HTML?: string; Text?: string };
    const token = extractToken(detail.HTML ?? detail.Text ?? "");
    if (!token) {
      return NextResponse.json(
        { error: "Could not parse magic link from email" },
        { status: 422 },
      );
    }

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Mailpit unavailable — run pnpm docker:up" },
      { status: 503 },
    );
  }
}
