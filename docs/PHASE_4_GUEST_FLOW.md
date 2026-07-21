# Phase 4 — Guest Flow (Locked)

**Status:** ✅ Confirmed working — do not change this flow without explicit product approval.

This document records the **approved guest journey** after mobile + QR testing (July 2026).

---

## 1. End-to-end flow

```
Couple prints QR  →  Guest scans QR  →  Event landing  →  Upload / Gallery
                                              ↓
                                    Name entry (once only)
                                              ↓
                                    Upload confirm  →  Upload progress
```

### Step-by-step

| Step | Screen | What happens |
|------|--------|--------------|
| 1 | **QR code** (`/{slug}/qr`) | Couple prints/downloads QR. QR encodes `PUBLIC_EVENT_BASE_URL/{slug}` — **not** `/qr`, not `/upload`. |
| 2 | **Event landing** (`/{slug}`) | Hero (names, date, cover), **Upload Photos**, **View Gallery**. **No name prompt here.** |
| 3 | **Name entry** (modal) | Shown **only** when guest taps Upload Photos or View Gallery **and has no active session**. |
| 4 | **Upload page** (`/{slug}/upload`) | Gallery picker + Take a picture. After select/capture → preview card → **Upload** / **Cancel**. |
| 5 | **Return visit** (same device, ≤24h) | Landing → Upload/Gallery **without** name prompt (session cookie). |

---

## 2. Rules (do not break)

### Name entry

- **Ask once** per guest session (24h cookie `memopics_guest`).
- **Never** show name modal on landing load after QR scan.
- **Do** show name modal when tapping Upload or Gallery if `GET /v1/public/events/:slug/guest-session` returns `{ active: false }`.
- **Do not** re-ask after session exists (even if guest leaves and returns).

### QR code

- URL in QR = `{PUBLIC_EVENT_BASE_URL}/{slug}` (e.g. `http://192.168.0.105:3000/wedding-jul-2026`).
- **Never** encode `localhost` in QR — phones cannot reach it.
- Printable page: `/{slug}/qr` (couple/dev only).

### QR print page UI (`/{slug}/qr`) — locked

Approved layout (do **not** revert without sign-off):

```
┌─────────────────────────────┐
│   SCAN TO SHARE PHOTOS      │
│   Daniella & Demetris       │  ← event title
│   03.10.2026                │  ← event date (DD.MM.YYYY)
│   [ QR code image ]         │
│   Guests scan this code…    │  ← helper text only
│   [ Download ] [ Print ]    │
└─────────────────────────────┘
```

| Rule | Detail |
|------|--------|
| **Event date** | Shown **below names**, centered. Format **`DD.MM.YYYY`** via `formatEventDateDots()` in `apps/web/src/lib/utils.ts`. Source: **`eventDate` per event** from DB via `GET /v1/public/events/:slug/qr` — **not hardcoded**; each event has its own date. |
| **No URL text** | Do **not** display `eventUrl` as text under the QR. The link is only **inside** the QR image (redundant with browser bar on screen; cleaner for print). |
| **Helper text** | Keep: “Guests scan this code with their phone camera — no app install needed.” |
| **Implementation** | `apps/web/src/app/[slug]/qr/page.tsx`, API `getPublicEventQr()` returns `eventDate`. |

**Dev — fresh test (same event):** `node scripts/reset-event-guest-data.mjs wedding-jul-2026 --date 2026-10-03` — deletes guest sessions + uploads for that event; then use **Private tab** on phone (cookie is on device, not in DB).

**Dev — change one event’s date:** `node scripts/set-event-date.mjs <slug> YYYY-MM-DD` (e.g. `wedding-jul-2026 2026-10-03` → displays **03.10.2026**). In production, date is set when the couple creates/edits the event (Phase 5 settings).

**Test event (July 2026):** slug `wedding-jul-2026` — date set to **03.10.2026** for Daniella’s testing only; other events show their own dates.

### Upload UX

- **Tap to select photos** → gallery only (multiple).
- **Take a picture** → camera only (single).
- After pick/capture → preview + **Upload** / **Cancel** (no instant upload).
- On **Upload** confirm → immediate loading + progress bar.

### Limits (MVP)

- Max **25 MB** per photo.
- Max **15 photos** per batch.
- Allowed: JPEG, PNG, WebP, HEIC.

---

## 3. Key routes & files

| Route | Purpose |
|-------|---------|
| `/{slug}` | Event landing (`event-landing-client.tsx`) |
| `/{slug}/qr` | Printable QR (`app/[slug]/qr/page.tsx`) |
| `/{slug}/upload` | Guest upload (`upload-page-client.tsx`) |
| `/{slug}/gallery` | Guest gallery (`gallery-page-client.tsx`) |

| API | Purpose |
|-----|---------|
| `GET /v1/public/events/:slug/guest-session` | Session check (`active: true/false`) |
| `POST /v1/public/events/:slug/guest-session` | Create session + set cookie |
| `GET /v1/public/events/:slug/qr` | QR PNG + `title`, `eventDate`, `eventUrl` (URL not shown in UI) |

---

## 4. Local mobile testing

### Required `.env` (dev)

```env
PUBLIC_EVENT_BASE_URL=http://192.168.0.105:3000
STORAGE_LAN_ENDPOINT=http://192.168.0.105:9000
STORAGE_PUBLIC_ENDPOINT=http://192.168.0.105:9000   # or Tailscale IP for 4G
NEXT_PUBLIC_MOBILE_LAN_ORIGIN=http://192.168.0.105:3000
# NEXT_PUBLIC_MOBILE_PUBLIC_ORIGIN=http://100.x.x.x:3000  # optional, for 4G
```

Restart **API** after `.env` changes (QR URL comes from API).

### Test URLs

| Use | URL |
|-----|-----|
| QR page (PC) | `http://192.168.0.105:3000/wedding-jul-2026/qr` |
| Landing (after scan) | `http://192.168.0.105:3000/wedding-jul-2026` |

### Test as new guest

Use Safari **Private tab** or clear site data — otherwise old session cookie skips name entry.

---

## 5. Production

- Single public URL (e.g. `https://memopics.com/{slug}`).
- Guests use Wi‑Fi, 4G, or 5G — same URL, no LAN/Tailscale setup.
- One QR per event; many events = many unique slugs/QRs.

---

## 6. Out of scope (later)

- Couple dashboard QR page (Phase 5).
- Video upload.
- Changing name-entry timing (before vs after landing) without product sign-off.

**Last verified:** July 2026 — mobile LAN + QR + name-on-upload flow + QR page (date, no URL text).
