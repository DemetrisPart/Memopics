const API = process.env.API_URL ?? "http://localhost:3001/v1";
const MAILPIT = process.env.MAILPIT_API_URL ?? "http://localhost:8025/api/v1";
const EMAIL = process.argv[2] ?? "partasas96@icloud.com";

function parseCookies(res) {
  return (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function main() {
  await fetch(`${API}/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL }),
  });
  await new Promise((r) => setTimeout(r, 600));

  const list = await fetch(`${MAILPIT}/messages`);
  const { messages } = await list.json();
  const msg = messages.find((m) =>
    m.To?.some((t) => t.Address === EMAIL),
  );
  const detail = await fetch(`${MAILPIT}/message/${msg.ID}`);
  const body = await detail.json();
  const html = body.HTML ?? body.Text ?? "";
  const match = html.match(/token=([^"&\s<]+)/);
  const token = decodeURIComponent(match[1]);

  const verify = await fetch(`${API}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const cookies = parseCookies(verify);
  console.log("verify:", verify.status, await verify.json());

  const events = await fetch(`${API}/events`, {
    headers: { Cookie: cookies },
  });
  const eventsBody = await events.json();
  console.log("events:", events.status, JSON.stringify(eventsBody, null, 2));
}

main().catch(console.error);
