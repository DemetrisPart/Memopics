/**
 * Creates a test event for local guest UX testing.
 * Prerequisites: docker:up, db:migrate:deploy, API running, Mailpit on :8025
 */
const API = process.env.API_URL ?? "http://localhost:3001/v1";
const MAILPIT = process.env.MAILPIT_API_URL ?? "http://localhost:8025/api/v1";
const WEB = process.env.WEB_APP_URL ?? "http://localhost:3000";
const SLUG = process.env.TEST_EVENT_SLUG ?? "demetris-daniella";
const EMAIL = process.env.TEST_COUPLE_EMAIL ?? "test-couple@memopics.local";

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function getLatestMagicToken() {
  const list = await fetchJson(`${MAILPIT}/messages`);
  if (!list.res.ok) {
    throw new Error("Mailpit unavailable — run pnpm docker:up");
  }

  const messages = list.body?.messages ?? [];
  const msg =
    messages.find((m) =>
      m.To?.some?.((t) => t.Address?.includes("test-couple")),
    ) ?? messages[0];

  if (!msg) {
    throw new Error("No magic link email in Mailpit");
  }

  const detail = await fetchJson(`${MAILPIT}/message/${msg.ID}`);
  const html = detail.body?.HTML ?? detail.body?.Text ?? "";
  const match = html.match(/token=([^"&\s<]+)/);
  if (!match) {
    throw new Error("Could not parse magic link token from email");
  }

  return decodeURIComponent(match[1]);
}

async function main() {
  const existing = await fetchJson(`${API}/public/events/${SLUG}`);
  if (existing.res.ok) {
    console.log(
      JSON.stringify(
        {
          slug: SLUG,
          url: `${WEB}/${SLUG}`,
          qrPage: `${WEB}/${SLUG}/qr`,
          status: "already_exists",
          event: existing.body,
        },
        null,
        2,
      ),
    );
    return;
  }

  const register = await fetchJson(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL }),
  });

  if (!register.res.ok && register.res.status !== 409) {
    const magicLink = await fetchJson(`${API}/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL }),
    });
    if (!magicLink.res.ok) {
      throw new Error(`Auth failed: ${JSON.stringify(register.body)}`);
    }
  }

  await new Promise((r) => setTimeout(r, 800));
  const token = await getLatestMagicToken();

  const verify = await fetchJson(`${API}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!verify.res.ok) {
    throw new Error(`Verify failed: ${JSON.stringify(verify.body)}`);
  }

  const authCookie = parseCookies(verify.res);
  const create = await fetchJson(`${API}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      brideName: "Daniella",
      groomName: "Demetris",
      eventDate: "2026-08-15",
      slug: SLUG,
    }),
  });

  if (!create.res.ok) {
    throw new Error(`Create event failed: ${JSON.stringify(create.body)}`);
  }

  console.log(
    JSON.stringify(
      {
        slug: SLUG,
        url: `${WEB}/${SLUG}`,
        qrPage: `${WEB}/${SLUG}/qr`,
        status: "created",
        event: create.body,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
