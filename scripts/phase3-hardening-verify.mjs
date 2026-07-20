/**
 * Phase 3 scalability hardening — live verification script.
 * Prerequisites: docker:up, db:migrate:deploy, API + worker-media running.
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

const API = process.env.API_URL ?? "http://localhost:3001/v1";
const SLUG = "demetris-daniella";
const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function parseSetCookie(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

// Minimal valid JPEG (1x1 pixel)
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
  "base64",
);

async function main() {
  console.log("Phase 3 hardening live verification\n");

  // 1. Health + queue metrics
  try {
    const { res, body } = await fetchJson(`${API}/health`);
    if (res.ok && body.database === "ok" && body.queue) {
      pass("Health endpoint", `queue waiting=${body.queue.waiting} active=${body.queue.active}`);
    } else {
      fail("Health endpoint", JSON.stringify(body));
    }
  } catch (e) {
    fail("Health endpoint", String(e.message ?? e));
  }

  // 2. Public event
  try {
    const { res, body } = await fetchJson(`${API}/public/events/${SLUG}`);
    if (res.ok && body.slug === SLUG) {
      pass("Public event by slug");
    } else {
      fail("Public event by slug", `${res.status} ${JSON.stringify(body)}`);
    }
  } catch (e) {
    fail("Public event by slug", String(e.message ?? e));
  }

  // 3. Guest session + cookie
  let guestCookie = "";
  try {
    const { res, body } = await fetchJson(
      `${API}/public/events/${SLUG}/guest-session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Maria" }),
      },
    );
    guestCookie = parseSetCookie(res.headers);
    if (res.ok && guestCookie.includes("memopics_guest")) {
      pass("Guest session create", "cookie set");
    } else {
      fail("Guest session create", `${res.status} cookie=${guestCookie}`);
    }
  } catch (e) {
    fail("Guest session create", String(e.message ?? e));
  }

  // 4. Upload init → PUT → complete
  let batchId = null;
  try {
    const initRes = await fetchJson(
      `${API}/public/events/${SLUG}/uploads/init`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: guestCookie,
        },
        body: JSON.stringify({
          uploadSessionId: `verify-${Date.now()}`,
          files: [
            {
              clientFileId: "f1",
              contentType: "image/jpeg",
              contentLength: TINY_JPEG.length,
            },
          ],
        }),
      },
    );

    if (!initRes.res.ok) {
      fail("Upload init", `${initRes.res.status} ${JSON.stringify(initRes.body)}`);
    } else {
      batchId = initRes.body.batchId;
      const item = initRes.body.items?.[0];
      if (!item?.uploadUrl) {
        fail("Upload init", "missing uploadUrl");
      } else {
        pass("Upload init", `batchId=${batchId}`);

        const putRes = await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: TINY_JPEG,
        });
        if (putRes.ok) {
          pass("Presigned PUT to storage", `status=${putRes.status}`);
        } else {
          fail("Presigned PUT to storage", `status=${putRes.status}`);
        }

        const completeRes = await fetchJson(
          `${API}/public/events/${SLUG}/uploads/${batchId}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: guestCookie,
            },
            body: JSON.stringify({}),
          },
        );
        if (completeRes.res.ok) {
          pass("Upload complete", JSON.stringify(completeRes.body?.status ?? completeRes.body));
        } else {
          fail("Upload complete", `${completeRes.res.status} ${JSON.stringify(completeRes.body)}`);
        }
      }
    }
  } catch (e) {
    fail("Upload flow", String(e.message ?? e));
  }

  // 5. Worker processes media to ACTIVE (poll DB)
  if (batchId) {
    try {
      let active = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const out = execSync(
          `docker compose -f docker/docker-compose.yml exec -T postgres psql -U memopics -d memopics -t -c "SELECT status FROM media_assets WHERE upload_batch_id = (SELECT id FROM upload_batches WHERE id = '${batchId}'::uuid LIMIT 1) LIMIT 1;"`,
          { cwd: process.cwd(), encoding: "utf8" },
        ).trim();
        if (out === "ACTIVE") {
          active = true;
          break;
        }
      }
      if (active) {
        pass("Worker media processing", "media ACTIVE");
      } else {
        fail("Worker media processing", "media not ACTIVE within 15s");
      }
    } catch (e) {
      fail("Worker media processing", String(e.message ?? e));
    }
  }

  // 6. MinIO bucket private (anonymous GET should fail)
  try {
    const anon = await fetch("http://localhost:9000/memopics/", { method: "GET" });
    if (anon.status === 403 || anon.status === 401) {
      pass("MinIO private bucket", `anonymous GET → ${anon.status}`);
    } else {
      fail("MinIO private bucket", `anonymous GET → ${anon.status} (expected 401/403)`);
    }
  } catch (e) {
    fail("MinIO private bucket", String(e.message ?? e));
  }

  // 7. DB indexes from phase3 migration
  try {
    const out = execSync(
      `docker compose -f docker/docker-compose.yml exec -T postgres psql -U memopics -d memopics -t -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE 'guest_sessions_event_id_created_at_idx' OR indexname LIKE 'media_assets_event_id_status_idx';"`,
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const indexes = out.split("\n").map((l) => l.trim()).filter(Boolean);
    if (indexes.length >= 2) {
      pass("Phase 3 DB indexes", indexes.join(", "));
    } else {
      fail("Phase 3 DB indexes", `found: ${indexes.join(", ") || "none"}`);
    }
  } catch (e) {
    fail("Phase 3 DB indexes", String(e.message ?? e));
  }

  // 8. Guest session rate limit (10/hr/IP) — burst 12 requests
  try {
    let got429 = false;
    for (let i = 0; i < 12; i++) {
      const { res } = await fetchJson(
        `${API}/public/events/${SLUG}/guest-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": "203.0.113.99",
          },
          body: JSON.stringify({ firstName: `Rate${i}` }),
        },
      );
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    if (got429) {
      pass("Guest session rate limit", "429 after burst");
    } else {
      fail("Guest session rate limit", "no 429 in 12 requests");
    }
  } catch (e) {
    fail("Guest session rate limit", String(e.message ?? e));
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
