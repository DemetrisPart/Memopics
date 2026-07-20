# Stage 3 — Phase 2: Events

**Project:** Memopics  
**Parent stage:** [Stage 3 — MVP Build](./STAGE_3_MVP_PLAN.md)  
**Status:** Complete — reviewed and approved (2026-07-20)  
**Completion log:** [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md)  
**Depends on:** Phase 0 (Foundation), Phase 1 (API Core / Auth)  
**Blocks:** Phase 3 (Storage & Upload Pipeline), Phase 4 (Guest UX), Phase 5 (Couple Dashboard)

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Business Context](#2-business-context)
3. [User Stories](#3-user-stories)
4. [Architecture Overview](#4-architecture-overview)
5. [Domain Layer — Slug & URL Rules](#5-domain-layer--slug--url-rules)
6. [Database](#6-database)
7. [API Specification](#7-api-specification)
8. [Cover Photo Upload Flow](#8-cover-photo-upload-flow)
9. [QR Code Generation](#9-qr-code-generation)
10. [Security Model](#10-security-model)
11. [File Structure](#11-file-structure)
12. [Environment Variables](#12-environment-variables)
13. [Testing Strategy](#13-testing-strategy)
14. [Out of Scope (Deferred)](#14-out-of-scope-deferred)
15. [Phase 2 Review & Approval](#15-phase-2-review--approval)
16. [Local Verification](#16-local-verification)

---

## 1. Purpose & Scope

Phase 2 delivers the **event lifecycle backend** for the Memopics MVP: a couple creates an event with a human-readable URL (`memopics.com/demetris-daniella`), receives a QR code pointing to that URL, optionally sets a cover photo, and exposes a public API for the guest landing page.

### In Scope

| # | Deliverable |
|---|---|
| 1 | Create event (bride/groom names, date, slug, auto title) |
| 2 | List and retrieve owned events |
| 3 | Update event metadata (names, date, title) |
| 4 | Slug validation, normalization, availability check |
| 5 | Event stats (photo/video counts, storage usage) |
| 6 | QR code generation (on-demand PNG + JSON payload) |
| 7 | Cover photo upload (presigned init + complete) |
| 8 | Public event lookup by slug (guest landing page data) |
| 9 | Owner isolation via guard + service-layer checks |

### Explicitly Out of Scope

- Guest sessions, guest uploads, gallery (Phase 3–4)
- Couple dashboard UI (Phase 5)
- Event delete / soft-delete endpoint
- Slug change after creation
- Privacy mode UI toggle (DB field exists; default only)
- Payments, plan-based storage limits
- Per-event custom domains (V1)
- QR token rotation API (field stored; MVP QR uses slug URL)

---

## 2. Business Context

From Stage 0 and the Master Prompt:

- Every event has a **unique public URL**: `memopics.com/[slug]`
- Example approved slug: **`demetris-daniella`**
- QR codes redirect guests directly to this URL — no app install
- Events are **isolated** — one couple's event must never expose another's data
- Premium positioning: luxury, mobile-first, Mediterranean aesthetic (UI in Phase 4–5)

---

## 3. User Stories

### Couple (authenticated)

| As a couple… | I want to… | So that… |
|---|---|---|
| After login | Create an event with names, date, and custom URL | Guests can find our wedding page |
| During creation | Check if a URL slug is available | I pick a memorable, unique link |
| On my dashboard | See all my events with cover previews | I manage multiple events (future) |
| On event detail | View public URL, QR code, and stats | I share the event with guests |
| On event detail | Download a QR PNG | I print it for invitations |
| On settings | Update names and date | Details stay correct |
| On settings | Upload a cover photo | The landing page looks beautiful |

### Guest (public, unauthenticated)

| As a guest… | I want to… | So that… |
|---|---|---|
| After scanning QR | See bride/groom names, date, and cover | I know I'm at the right event |
| On landing page | Know the gallery privacy mode | I understand what I'll see (Phase 4 UI) |

---

## 4. Architecture Overview

```
┌─────────────────┐     JWT      ┌──────────────────────────────────┐
│  Couple client  │─────────────▶│  EventsController                │
│  (Phase 5 UI)   │              │  + EventOwnerGuard               │
└─────────────────┘              └──────────────┬───────────────────┘
                                              │
┌─────────────────┐     none     ┌────────────▼───────────────────┐
│  Guest browser  │─────────────▶│  PublicEventsController        │
│  (Phase 4 UI)   │              │  GET /v1/public/events/:slug   │
└─────────────────┘              └──────────────┬───────────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │  EventsService                │
                              │  + QrService                    │
                              │  + @memopics/domain utils       │
                              └───────┬───────────────┬─────────┘
                                      │               │
                         ┌────────────▼──┐    ┌───────▼────────┐
                         │  PostgreSQL   │    │  S3 / MinIO    │
                         │  (Prisma)     │    │  (presigned)   │
                         └───────────────┘    └────────────────┘
```

**Design decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| Event ID in URLs | Internal UUID only — never in public URLs | Stage 1 security; slug is the public identifier |
| QR payload | Slug URL only (no token) | Simple guest UX; scan → landing page |
| `qr_token` column | Stored, owner-visible, not in QR | Reserved for future rotatable QR validation (Stage 1) |
| QR storage | Generated on demand | No stale PNGs in storage; always matches current base URL |
| Slug immutability | No PATCH slug | Prevents broken printed QRs; slug change is V1+ feature |
| Owner access denied | HTTP 404 | Do not leak whether an event ID exists |

---

## 5. Domain Layer — Slug & URL Rules

**Location:** `packages/domain/src/events/event.utils.ts`

### Constants

| Constant | Value |
|---|---|
| `EVENT_SLUG_MIN_LENGTH` | 3 |
| `EVENT_SLUG_MAX_LENGTH` | 60 |
| `EVENT_SLUG_PATTERN` | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

### Reserved slugs

Blocked to avoid collisions with app routes and system paths:

`admin`, `api`, `auth`, `dashboard`, `pricing`, `health`, `login`, `register`, `verify`, `me`, `events`, `public`, `static`, `favicon.ico`, `robots.txt`, `sitemap.xml`

### Normalization (`normalizeEventSlug`)

1. Trim whitespace  
2. Lowercase  
3. Replace spaces/underscores with hyphens  
4. Strip non `[a-z0-9-]` characters  
5. Collapse repeated hyphens  
6. Remove leading/trailing hyphens  

**Examples:**

| Input | Normalized |
|---|---|
| `Demetris & Daniella` | `demetris-daniella` |
| `  Demetris--Daniella  ` | `demetris-daniella` |
| `hello@world!#` | `helloworld` |

### Validation (`validateEventSlug`)

Returns `{ valid, normalized?, error? }`. Fails if normalized slug is too short, too long, fails pattern, or is reserved.

### Title builder (`buildEventTitle`)

- Both names → `"Daniella & Demetris"`
- One name → that name
- Neither → `"Our Event"` (fallback)

### Public URL builder (`buildPublicEventUrl`)

```typescript
buildPublicEventUrl("https://memopics.com", "demetris-daniella")
// → "https://memopics.com/demetris-daniella"
```

Strips trailing slash from base URL. Works with any deployment-level or future custom domain base.

### Slug uniqueness policy

- **Database:** Global `UNIQUE` on `events.slug` (all rows, including soft-deleted)
- **Application:** `isSlugTaken()` uses `findUnique({ slug })` — no `deletedAt` filter
- **Rationale:** Prevents slug hijacking after event deletion; soft-deleted slugs remain permanently reserved
- **Race safety:** `P2002` unique constraint → `409 Conflict` on concurrent create

---

## 6. Database

**Schema:** `packages/database/prisma/schema.prisma`  
**Migration:** `packages/database/prisma/migrations/20260320120000_init/`

### `events` table (Phase 2 fields)

| Column | Type | Phase 2 usage |
|---|---|---|
| `id` | UUID PK | Internal only — couple API responses |
| `slug` | TEXT UNIQUE | Public URL identifier |
| `qr_token` | TEXT UNIQUE | Generated on create; owner-only; future use |
| `owner_user_id` | UUID FK → users | Ownership |
| `bride_name` | TEXT | Display + title builder |
| `groom_name` | TEXT | Display + title builder |
| `title` | TEXT | Display name |
| `event_date` | DATE | Wedding date |
| `cover_image_media_id` | UUID FK → media_assets | Optional cover |
| `status` | EventStatus enum | ACTIVE on create; public requires ACTIVE |
| `privacy_mode` | PrivacyMode enum | Default `OWN_UPLOADS_ONLY` |
| `show_guest_names_publicly` | BOOLEAN | Default `true`; UI deferred |
| `storage_used_bytes` | BIGINT | Updated on cover complete |
| `storage_limit_bytes` | BIGINT | Default 20 GB (MVP) |
| `deleted_at` | TIMESTAMPTZ | Soft delete filter on queries |

### Indexes (verified in migration)

| Index | Purpose |
|---|---|
| `events_slug_key` (UNIQUE) | Slug lookups — O(1) |
| `events_qr_token_key` (UNIQUE) | Future QR token lookup |
| `events_owner_user_id_idx` | List events by owner |
| `events_status_idx` | Filter ACTIVE / EXPIRED |
| `events_deleted_at_idx` | Soft-delete queries |

### Foreign keys

| FK | On delete |
|---|---|
| `owner_user_id` → `users` | RESTRICT |
| `cover_image_media_id` → `media_assets` | SET NULL |

### Relations used in Phase 2

```
User 1──* Event
Event 1──0..1 MediaAsset (cover)
Event 1──* MediaAsset (all media)
```

---

## 7. API Specification

**Base URL:** `http://localhost:3001/v1` (local)  
**Auth:** JWT in HTTP-only cookie (Phase 1) — all `/events/*` routes except none require auth at controller level.

### 7.1 Couple endpoints (JWT required)

#### `POST /events` — Create event

**Request body:**

```json
{
  "brideName": "Daniella",
  "groomName": "Demetris",
  "eventDate": "2026-08-15",
  "slug": "demetris-daniella",
  "title": "Optional custom title"
}
```

| Field | Required | Validation |
|---|---|---|
| `brideName` | Yes | 1–120 chars |
| `groomName` | Yes | 1–120 chars |
| `eventDate` | Yes | ISO date string |
| `slug` | Yes | 3–60 chars → domain validation |
| `title` | No | Max 200 chars; auto-generated if omitted |

**Response `201`:** Full event object (includes `qrToken`, `publicUrl`)

**Errors:** `400` invalid slug · `409` slug taken · `401` unauthenticated

---

#### `GET /events` — List my events

**Response `200`:** Array of events (newest first). No `qrToken` in list items.

---

#### `GET /events/check-slug/:slug` — Check availability

**Response `200`:**

```json
{
  "available": true,
  "slug": "demetris-daniella"
}
```

Or when taken/invalid:

```json
{
  "available": false,
  "slug": "demetris-daniella",
  "error": "This event URL is already taken"
}
```

Input is normalized before check. Requires JWT (prevents public slug enumeration).

---

#### `GET /events/:id` — Event detail

**Guard:** `EventOwnerGuard`  
**Response:** Full event + `qrToken` + presigned `coverImageUrl`

---

#### `PATCH /events/:id` — Update event

**Guard:** `EventOwnerGuard`  
**Body (all optional):** `brideName`, `groomName`, `title`, `eventDate`  
**Note:** Slug cannot be changed.

---

#### `GET /events/:id/stats` — Event statistics

**Guard:** `EventOwnerGuard`

**Response `200`:**

```json
{
  "photoCount": 0,
  "videoCount": 0,
  "storageUsedBytes": "0",
  "storageLimitBytes": "21474836480",
  "storageUsedPercent": 0
}
```

Counts only `ACTIVE`, non-deleted media assets.

---

#### `GET /events/:id/qr` — QR JSON

**Guard:** `EventOwnerGuard`

**Response `200`:**

```json
{
  "slug": "demetris-daniella",
  "eventUrl": "https://memopics.com/demetris-daniella",
  "qrCodePngBase64": "<base64 PNG>"
}
```

---

#### `GET /events/:id/qr/download` — QR PNG download

**Guard:** `EventOwnerGuard`  
**Response:** `image/png` attachment `{slug}-qr.png`

---

#### `POST /events/:id/cover/init` — Start cover upload

**Guard:** `EventOwnerGuard`

**Request:**

```json
{
  "contentType": "image/jpeg",
  "contentLength": 1048576,
  "fileName": "cover.jpg"
}
```

**Response `200`:**

```json
{
  "mediaId": "uuid",
  "uploadUrl": "https://minio.../presigned",
  "expiresAt": "2026-08-15T12:00:00.000Z"
}
```

**Validation:** Allowed MIME types only; max 15 MB.

---

#### `POST /events/:id/cover/complete` — Finalize cover

**Guard:** `EventOwnerGuard`

**Request:**

```json
{
  "mediaId": "uuid-from-init"
}
```

Verifies object exists in storage, activates media, sets cover, updates storage counter. Soft-deletes previous cover media if replaced.

---

### 7.2 Public endpoint (no auth)

#### `GET /public/events/:slug` — Public event page data

**Response `200`:**

```json
{
  "slug": "demetris-daniella",
  "title": "Daniella & Demetris",
  "brideName": "Daniella",
  "groomName": "Demetris",
  "eventDate": "2026-08-15",
  "privacyMode": "OWN_UPLOADS_ONLY",
  "coverImageUrl": "https://...presigned..." 
}
```

**Filters:** `status = ACTIVE`, `deleted_at IS NULL`  
**Excluded:** `id`, `ownerUserId`, `qrToken`, storage, status, timestamps  
**Errors:** `404` for invalid slug, reserved slug, non-existent, expired, or deleted events (uniform message: `"Event not found"`)

---

### 7.3 Couple event response shape (full)

```json
{
  "id": "uuid",
  "slug": "demetris-daniella",
  "title": "Daniella & Demetris",
  "brideName": "Daniella",
  "groomName": "Demetris",
  "eventDate": "2026-08-15",
  "status": "ACTIVE",
  "privacyMode": "OWN_UPLOADS_ONLY",
  "showGuestNamesPublicly": true,
  "storageUsedBytes": "0",
  "storageLimitBytes": "21474836480",
  "coverImageMediaId": null,
  "coverImageUrl": null,
  "publicUrl": "http://localhost:3000/demetris-daniella",
  "qrToken": "secret-token-owner-only",
  "createdAt": "2026-07-20T...",
  "updatedAt": "2026-07-20T..."
}
```

---

## 8. Cover Photo Upload Flow

```
Couple                    API                         Storage
  │                        │                            │
  │ POST cover/init        │                            │
  │───────────────────────▶│ create PENDING MediaAsset  │
  │◀───────────────────────│ presigned uploadUrl        │
  │                        │                            │
  │ PUT uploadUrl (file)   │                            │
  │────────────────────────────────────────────────────▶│
  │                        │                            │
  │ POST cover/complete    │                            │
  │───────────────────────▶│ verify objectExists        │
  │                        │ ACTIVE media + set cover   │
  │◀───────────────────────│ updated event              │
```

**Storage key pattern:**

```
{APP_ENV}/events/{eventId}/originals/{mediaId}.{ext}
```

**Cover-specific behavior:**

- Creates `MediaAsset` with status `PENDING` before upload
- On complete: status → `ACTIVE`, `coverImageMediaId` updated
- Previous cover soft-deleted; storage delta adjusted atomically in transaction
- Cover bypasses Sharp worker in Phase 2 (original served via presigned URL); guest photo pipeline in Phase 3

---

## 9. QR Code Generation

**Service:** `apps/api/src/events/qr.service.ts`  
**Library:** `qrcode`

| Setting | Value |
|---|---|
| Format | PNG |
| Width | 512 px |
| Margin | 2 |
| Error correction | M (medium) |

**URL source:**

1. `PUBLIC_EVENT_BASE_URL` (production: `https://memopics.com`)
2. Fallback: `WEB_APP_URL`
3. Fallback: `http://localhost:3000`

**Determinism:** Same slug + same base URL + fixed options → identical PNG bytes.

**Security:** QR encodes **only** the public slug URL. No `qrToken`, no UUID, no auth parameters.

---

## 10. Security Model

### Access control matrix

| Resource | Couple (owner) | Couple (other) | Guest (public) |
|---|---|---|---|
| Create event | ✅ | — | — |
| List own events | ✅ | — | — |
| Event by ID | ✅ | ❌ 404 | — |
| Event by slug | ✅ (via ID) | — | ✅ ACTIVE only |
| Stats / QR / cover | ✅ | ❌ 404 | — |
| `qrToken` | ✅ detail only | ❌ | ❌ |

### `EventOwnerGuard`

Applied to: `GET/PATCH :id`, stats, QR, cover routes.

Checks: `id = param`, `ownerUserId = JWT sub`, `deletedAt IS NULL`, `status != DELETED`.

Returns **404** (not 403) when event missing or not owned.

### Data minimization (public)

Public responses intentionally omit internal identifiers and operational data. Invalid slug formats return 404 (not 400) to avoid leaking validation rules.

### Cover upload

- MIME whitelist enforced
- Size limit enforced (15 MB)
- Presigned URL TTL: 15 minutes
- Internal storage key **not** returned to client
- Upload must belong to same event as authenticated owner

---

## 11. File Structure

```
apps/api/src/events/
├── dto/
│   └── event.dto.ts           # CreateEventDto, UpdateEventDto, Cover DTOs
├── guards/
│   └── event-owner.guard.ts   # Ownership guard
├── events.controller.ts       # Couple routes
├── events.service.ts          # Business logic
├── events.module.ts           # NestJS module wiring
├── public-events.controller.ts
└── qr.service.ts              # QR PNG generation

packages/domain/src/events/
├── event.utils.ts             # Slug, title, URL helpers
└── event.utils.test.ts        # Unit tests (12 cases)

packages/database/prisma/
└── schema.prisma              # Event model + relations
```

---

## 12. Environment Variables

| Variable | Example (local) | Production | Purpose |
|---|---|---|---|
| `PUBLIC_EVENT_BASE_URL` | `http://localhost:3000` | `https://memopics.com` | QR codes + `publicUrl` field |
| `WEB_APP_URL` | `http://localhost:3000` | `https://memopics.com` | Fallback for public URL |
| `APP_ENV` | `development` | `production` | Storage key prefix |
| `DATABASE_URL` | Postgres connection | — | Prisma |
| S3/MinIO vars | See `.env.example` | R2 credentials | Presigned URLs |

---

## 13. Testing Strategy

### Implemented (Phase 2)

| Layer | Coverage |
|---|---|
| Domain unit tests | Slug validation, normalization, title, URL builder (12 tests) |
| Build verification | `pnpm build` — all 8 packages |

### Planned (Phase 6)

| Layer | Coverage |
|---|---|
| Integration | `EventOwnerGuard` — owner vs non-owner access |
| Integration | Public endpoint — field exclusion, ACTIVE-only filter |
| Integration | Slug race — concurrent create → 409 |
| E2E | Create event → upload cover → public lookup |

---

## 14. Out of Scope (Deferred)

| Item | Target phase |
|---|---|
| Guest upload init/complete | Phase 3 |
| BullMQ + Sharp processing | Phase 3 |
| Public event page UI (`/[slug]`) | Phase 4 |
| Dashboard event pages | Phase 5 |
| Event delete endpoint | Phase 5 or 6 |
| Orphan PENDING cover cleanup job | Phase 3+ |
| Privacy mode toggle UI | V1 |
| Per-event custom domain | V1 |
| QR token rotation API | V1 |
| Rate limiting on public slug lookup | Phase 6 |

---

## 15. Phase 2 Review & Approval

**Review date:** 2026-07-20  
**Status:** ✅ **Approved**

| Area | Result |
|---|---|
| Event security | Pass |
| Slug system | Pass |
| Database | Pass |
| QR | Pass |
| Code quality | Pass |

### Fixes applied during review

1. Public slug lookup uses full normalization + validation  
2. Slug availability aligned with DB global unique constraint  
3. Prisma `P2002` handling on concurrent create  
4. Removed internal `storageKey` from cover init response  
5. Slug check consolidated in `EventsService`  
6. Duplicate DB query removed from stats  
7. Additional domain unit tests  

### Known deferred (non-blocking)

- No event delete endpoint yet  
- Orphan PENDING cover uploads if client abandons flow  
- No integration tests for guard (Phase 6)  

---

## 16. Local Verification

```bash
pnpm docker:up
pnpm db:migrate:deploy
pnpm --filter @memopics/api dev
```

Authenticate via Phase 1 magic link flow, then:

```bash
# Create event
curl -X POST http://localhost:3001/v1/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "brideName": "Daniella",
    "groomName": "Demetris",
    "eventDate": "2026-08-15",
    "slug": "demetris-daniella"
  }'

# Check slug
curl http://localhost:3001/v1/events/check-slug/demetris-daniella -b cookies.txt

# Public page (no auth)
curl http://localhost:3001/v1/public/events/demetris-daniella

# QR payload
curl http://localhost:3001/v1/events/{id}/qr -b cookies.txt
```

---

## Document Map (Stage 3 phases)

| Phase | Document |
|---|---|
| Plan | [STAGE_3_MVP_PLAN.md](./STAGE_3_MVP_PLAN.md) |
| 0 — Foundation | [PHASE_0_COMPLETE.md](./PHASE_0_COMPLETE.md) |
| 1 — API Core | [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) |
| **2 — Events** | **This document** + [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md) |
| 3 — Upload Pipeline | *(pending)* |

---

**Next:** [Phase 3 — Storage & Upload Pipeline](./STAGE_3_MVP_PLAN.md#phase-3--storage--upload-pipeline-day-5–7)
