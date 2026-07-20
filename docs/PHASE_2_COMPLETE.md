# Phase 2 — Events Complete

**Full specification:** [STAGE_3_PHASE_2_EVENTS.md](./STAGE_3_PHASE_2_EVENTS.md)

## Endpoints

### Couple (JWT required)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/events` | Create event |
| GET | `/v1/events` | List my events |
| GET | `/v1/events/check-slug/:slug` | Check slug availability |
| GET | `/v1/events/:id` | Event detail |
| PATCH | `/v1/events/:id` | Update event settings |
| GET | `/v1/events/:id/stats` | Photo/video counts + storage |
| GET | `/v1/events/:id/qr` | QR JSON (URL + base64 PNG) |
| GET | `/v1/events/:id/qr/download` | Download QR PNG |
| POST | `/v1/events/:id/cover/init` | Presigned cover upload URL |
| POST | `/v1/events/:id/cover/complete` | Attach cover after upload |

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/v1/public/events/:slug` | Public event page data |

## Example

Create event with URL `memopics.com/demetris-daniella`:

```json
POST /v1/events
{
  "brideName": "Daniella",
  "groomName": "Demetris",
  "eventDate": "2026-08-15",
  "slug": "demetris-daniella"
}
```

Public page: `GET /v1/public/events/demetris-daniella`

Set `PUBLIC_EVENT_BASE_URL=https://memopics.com` in production for QR codes.

## Domain

- `validateEventSlug()` — format + reserved words
- `normalizeEventSlug()` — lowercase, strip invalid chars, collapse hyphens
- `buildEventTitle()` — "Bride & Groom"
- `buildPublicEventUrl()` — base + slug (works with custom domains)

## Security

- `EventOwnerGuard` — couple can only access owned events; returns 404 (not 403) for non-owned IDs
- Public endpoint returns ACTIVE, non-deleted events only
- Public response excludes: `id`, `ownerUserId`, `qrToken`, storage stats, `status`, timestamps
- Public response includes: `slug`, `title`, names, date, `privacyMode`, presigned `coverImageUrl`
- `qrToken` returned only to authenticated owner on create/detail/update/cover-complete (reserved for future QR rotation; MVP QR uses slug URL only)
- Slug availability checks include soft-deleted events (DB enforces global slug uniqueness)
- Cover upload init returns `mediaId` + presigned `uploadUrl` only (no internal storage key)

## Database

- `events.slug` — UNIQUE index for fast lookups
- `events.qr_token` — UNIQUE index (future use)
- `events.owner_user_id` — indexed for ownership queries
- `events.status`, `events.deleted_at` — indexed; all owner/public queries filter soft-deleted rows
- FK: `owner_user_id` → `users`, `cover_image_media_id` → `media_assets`

## QR

- Encodes public slug URL via `PUBLIC_EVENT_BASE_URL` (fallback: `WEB_APP_URL`)
- Fixed options (512px, margin 2, EC level M) — deterministic for same slug + base URL
- No tokens or internal IDs in QR payload

## Custom domains (future)

Per-event white-label domains (`custom.domain/[slug]`) are not in MVP. `buildPublicEventUrl()` and `PUBLIC_EVENT_BASE_URL` are deployment-level today. Per-event `custom_domain` column is planned in Stage 1 architecture for V1.

## Phase 2 Review (2026-07-20)

**Status: Approved** after fixes below.

| Area | Result |
|---|---|
| Event security | Pass — owner isolation via guard + service; public data minimized |
| Slug system | Pass — global uniqueness, normalization, race-safe create |
| Database | Pass — relations, FKs, indexes verified in migration |
| QR | Pass — public URL only, no secrets |
| Code quality | Pass — no temp code; controller logic consolidated in service |

### Fixes applied during review

1. Public slug lookup now uses `normalizeEventSlug` + `validateEventSlug` (was trim/lowercase only)
2. Slug availability aligned with DB global unique constraint (includes soft-deleted slugs)
3. Prisma `P2002` handling on concurrent slug creation
4. Removed internal `storageKey` from cover upload init response
5. Moved slug check from controller to `EventsService.checkSlugAvailability()`
6. Removed duplicate DB query in `getEventStats`
7. Added domain tests for invalid characters, max length, custom domain URLs

### Known deferred items (not blockers)

- Event soft-delete endpoint not in Phase 2 (no delete flow yet)
- Orphan `PENDING` cover uploads if client never completes — cleanup in Phase 3+
- Integration tests for `EventOwnerGuard` — planned Phase 6 hardening

## Next: Phase 3 — Storage & Upload Pipeline
