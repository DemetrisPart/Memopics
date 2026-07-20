# Stage 3 — Phase 3: Storage & Upload Pipeline

**Project:** Memopics  
**Parent stage:** [Stage 3 — MVP Build](./STAGE_3_MVP_PLAN.md)  
**Status:** Complete — ready for review  
**Completion log:** [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md)  
**Depends on:** Phase 0 (Foundation), Phase 1 (Auth), Phase 2 (Events)  
**Blocks:** Phase 4 (Guest UX UI), Phase 5 (Couple gallery dashboard)

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Storage Layer](#3-storage-layer)
4. [Domain Layer](#4-domain-layer)
5. [Guest Session (Pipeline Prerequisite)](#5-guest-session-pipeline-prerequisite)
6. [Upload Pipeline](#6-upload-pipeline)
7. [Media Status Lifecycle](#7-media-status-lifecycle)
8. [BullMQ Queue](#8-bullmq-queue)
9. [Image Worker (Sharp)](#9-image-worker-sharp)
10. [API Specification](#10-api-specification)
11. [Security Model](#11-security-model)
12. [Database](#12-database)
13. [Environment Variables](#13-environment-variables)
14. [File Structure](#14-file-structure)
15. [Testing Strategy](#15-testing-strategy)
16. [Out of Scope (Deferred)](#16-out-of-scope-deferred)
17. [Local Verification](#17-local-verification)

---

## 1. Purpose & Scope

Phase 3 delivers the **end-to-end guest photo upload pipeline**: guests authenticate with a name + cookie, receive presigned URLs, upload directly to object storage (MinIO/R2), the API verifies uploads and enqueues background jobs, and `worker-media` generates gallery-ready variants with Sharp.

### In Scope

| # | Deliverable |
|---|---|
| 1 | Extend `StorageService` with `getObjectBuffer` + `putObject` (worker + MIME verify) |
| 2 | Domain: MIME magic-byte validation, storage quota checks, queue job types |
| 3 | Guest session API (name entry + HTTP-only cookie) — backend for Phase 4 UI |
| 4 | Upload init: presigned URLs, batch + media records |
| 5 | Upload complete: storage verify, MIME sniff, quota update, enqueue jobs |
| 6 | BullMQ `media` queue (Redis) |
| 7 | `worker-media`: Sharp → `thumb` (400px) + `web` (2048px) WebP variants |
| 8 | Media status lifecycle: PENDING → PROCESSING → ACTIVE / FAILED / QUARANTINED |

### Explicitly Out of Scope

- Guest upload UI (Phase 4)
- Public gallery API + UI (Phase 4)
- Couple gallery list/delete (Phase 5)
- Rate limiting middleware (Phase 6)
- Orphan PENDING media cleanup job
- Video upload / HLS processing
- CDN configuration
- Virus scanning (ClamAV → V1)

---

## 2. Architecture Overview

```
Guest browser                API (NestJS)                    Redis / BullMQ
     │                           │                                │
     │ POST guest-session        │                                │
     │──────────────────────────▶│ create GuestSession + cookie   │
     │                           │                                │
     │ POST uploads/init         │                                │
     │──────────────────────────▶│ PENDING MediaAsset + batch     │
     │◀──────────────────────────│ presigned PUT URLs             │
     │                           │                                │
     │ PUT presigned URL         │                                │
     │──────────────────────────────────────────▶ MinIO / R2      │
     │                           │                                │
     │ POST uploads/.../complete │                                │
     │──────────────────────────▶│ verify + MIME sniff            │
     │                           │ PROCESSING + enqueue ─────────▶│ media queue
     │◀──────────────────────────│                                │
     │                           │                                │
     │                           │         worker-media             │
     │                           │◀───────────────────────────────│
     │                           │         Sharp variants         │
     │                           │         ACTIVE + MediaVariant  │
```

**Core principle:** The API **never receives file bytes**. Clients upload directly to object storage via presigned PUT URLs (same pattern as Phase 2 cover uploads).

---

## 3. Storage Layer

**Interface:** `packages/domain/src/storage/storage-service.interface.ts`  
**Implementation:** `packages/storage/src/s3-storage.service.ts`

### Methods

| Method | Used by | Purpose |
|---|---|---|
| `getPresignedUploadUrl` | API init | Client direct upload |
| `getPresignedDownloadUrl` | API (Phase 2/4) | Signed read URLs |
| `getObjectBuffer` | API complete, worker | MIME sniff / Sharp input |
| `putObject` | Worker | Store thumb + web variants |
| `objectExists` | API complete | Verify upload landed |
| `deleteObject` | Future delete flows | Remove objects |

### `getObjectBuffer` options

```typescript
getObjectBuffer({ key, maxBytes?: number })
```

When `maxBytes` is set, uses S3 `Range: bytes=0-(N-1)` for efficient MIME sniffing (4100 bytes on complete).

### Object key patterns

| Type | Pattern |
|---|---|
| Original | `{env}/events/{eventId}/originals/{mediaId}.{ext}` |
| Thumb | `{env}/events/{eventId}/images/{mediaId}/thumb.webp` |
| Web | `{env}/events/{eventId}/images/{mediaId}/web.webp` |

---

## 4. Domain Layer

**Location:** `packages/domain/src/media/`

### MIME validation (`mime.utils.ts`)

- `detectMimeFromBuffer(buffer)` — magic-byte sniffing (JPEG, PNG, WebP, HEIC)
- `mimeMatchesDeclared(detected, declared)` — compare sniff vs client Content-Type
- `isAllowedPhotoMimeType(mime)` — whitelist check
- HEIC/HEIF treated as equivalent

### Storage quota (`storage-quota.utils.ts`)

```typescript
checkStorageQuota({ storageUsedBytes, storageLimitBytes, incomingBytes })
// → { allowed, remainingBytes, wouldExceedBy? }
```

Checked on **init** (projected batch size) and **complete** (verified files only).

### Image processing constants (`image-processing.constants.ts`)

| Variant | Max dimension | Format | Quality |
|---|---|---|---|
| THUMB | 400px | WebP | 80 |
| WEB | 2048px | WebP | 85 |

### Queue types (`queue/media-job.types.ts`)

```typescript
interface MediaProcessImageJobPayload {
  mediaAssetId: string;
  eventId: string;
}
```

### Shared queue constants (`packages/shared/src/queue.constants.ts`)

- Queue name: `media`
- Job name: `process-image`

---

## 5. Guest Session (Pipeline Prerequisite)

Phase 4 builds the name-entry UI. Phase 3 implements the **backend** so uploads can be tested via API/curl.

### Flow

1. Guest POSTs first name (+ optional last name) to `/guest-session`
2. API creates `guest_sessions` row with hashed token
3. HTTP-only cookie `memopics_guest` set (24h TTL)
4. Upload endpoints require valid cookie scoped to event slug

### Cookie security

| Setting | Value |
|---|---|
| `httpOnly` | true |
| `secure` | true in production |
| `sameSite` | lax |
| Token storage | SHA-256 hash in DB; plain token in cookie only |

---

## 6. Upload Pipeline

### 6.1 Init (`POST .../uploads/init`)

**Preconditions:** Active event, valid guest cookie, ≤ 10 files, ≤ 15 MB each, allowed MIME, storage quota OK, guest hourly limit OK (50/hour).

**Creates:**
- `upload_batches` row — status `UPLOADING`
- `media_assets` rows — status `PENDING`, linked to batch + guest session

**Returns:** `{ batchId, uploadSessionId, items: [{ mediaId, clientFileId, uploadUrl, expiresAt }] }`

`uploadSessionId` is client-provided (UUID) for resume within same browser session (Phase 4 UI).

### 6.2 Client upload

Client PUTs each file to its presigned URL (15 min TTL).

### 6.3 Complete (`POST .../uploads/:batchId/complete`)

For each PENDING media in batch:

1. `objectExists(originalKey)` — fail → `QUARANTINED`
2. `getObjectBuffer({ key, maxBytes: 4100 })` — magic-byte sniff
3. `mimeMatchesDeclared` — fail → `QUARANTINED` + upload error log

For verified media:

1. Status → `PROCESSING`
2. Event `storage_used_bytes` incremented (original size only)
3. BullMQ job enqueued (`jobId = mediaAssetId` for idempotency)

**Batch status:**
- All verified → `COMPLETED`
- Mixed → `PARTIAL`
- None verified → `FAILED` + HTTP 400

---

## 7. Media Status Lifecycle

```
                    ┌─────────────┐
                    │   PENDING   │  ← created at init
                    └──────┬──────┘
                           │ complete + verify
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌──────────┐ ┌─────────────┐
       │ QUARANTINED│ │PROCESSING│ │   (skip)    │
       │ MIME/miss  │ └────┬─────┘ └─────────────┘
       └────────────┘      │ worker
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌────────┐
              │ ACTIVE  │   │ FAILED │
              │+variants│   │        │
              └─────────┘   └────────┘
```

| Status | Meaning |
|---|---|
| `PENDING` | Presigned URL issued; awaiting client upload |
| `PROCESSING` | Upload verified; worker job queued/running |
| `ACTIVE` | Variants generated; visible in gallery (Phase 4+) |
| `FAILED` | Worker exhausted retries |
| `QUARANTINED` | Failed MIME or missing object on complete |

---

## 8. BullMQ Queue

**Producer:** `apps/api/src/queue/media-queue.service.ts`  
**Consumer:** `apps/worker-media/src/media-processor.ts`

| Setting | Value |
|---|---|
| Queue | `media` |
| Job | `process-image` |
| Connection | `REDIS_URL` |
| Attempts | 3 |
| Backoff | exponential, 5s base |
| Concurrency | 2 |
| Job ID | `mediaAssetId` (dedup) |

---

## 9. Image Worker (Sharp)

**Package:** `apps/worker-media`

### Processing steps

1. Load `MediaAsset` — must be `PROCESSING` (skip if already `ACTIVE`)
2. Download original via `getObjectBuffer`
3. Read metadata (width, height) — auto-rotate via EXIF
4. Generate thumb (400px fit-inside WebP)
5. Generate web (2048px fit-inside WebP)
6. `putObject` both variants
7. Upsert `media_variants` (THUMB, WEB)
8. Update media → `ACTIVE` with dimensions

### Failure handling

- Job failure after retries → media status `FAILED`
- Structured log via `logWorkerError`

### Run locally

```bash
pnpm --filter @memopics/worker-media dev
```

Requires Redis + MinIO + Postgres (same `.env` as API).

---

## 10. API Specification

**Base URL:** `http://localhost:3001/v1`

### `POST /public/events/:slug/guest-session`

**Auth:** None

**Body:**
```json
{ "firstName": "Maria", "lastName": "K." }
```

**Response `200`:**
```json
{ "firstName": "Maria", "lastName": "K.", "expiresInHours": 24 }
```

Sets `memopics_guest` cookie.

---

### `POST /public/events/:slug/uploads/init`

**Auth:** Guest cookie

**Body:**
```json
{
  "uploadSessionId": "client-uuid-for-resume",
  "files": [
    {
      "clientFileId": "local-1",
      "contentType": "image/jpeg",
      "contentLength": 1048576,
      "fileName": "photo.jpg"
    }
  ]
}
```

**Response `200`:**
```json
{
  "batchId": "uuid",
  "uploadSessionId": "client-uuid-for-resume",
  "items": [
    {
      "mediaId": "uuid",
      "clientFileId": "local-1",
      "uploadUrl": "https://...",
      "expiresAt": "2026-07-20T..."
    }
  ]
}
```

**Errors:** `400` validation · `401` no guest session · `404` event · `409` quota/hourly limit

---

### `POST /public/events/:slug/uploads/:batchId/complete`

**Auth:** Guest cookie

**Body (optional):**
```json
{ "mediaIds": ["uuid-1", "uuid-2"] }
```

Omit `mediaIds` to complete all PENDING items in batch.

**Response `200`:**
```json
{
  "batchId": "uuid",
  "status": "COMPLETED",
  "queuedCount": 2,
  "failedCount": 0,
  "failed": []
}
```

---

## 11. Security Model

| Control | Implementation |
|---|---|
| Event isolation | All queries scoped by `eventId` from slug + guest session |
| Guest auth | Hashed session token in cookie; 24h TTL |
| Upload auth | `GuestSessionGuard` on init/complete |
| MIME validation | Magic bytes on complete (not client-declared type alone) |
| Size limits | 15 MB per file, 10 per batch |
| Abuse limits | 50 uploads per guest session per hour |
| Storage cap | 20 GB per event (hardcoded MVP) |
| Presigned TTL | 15 min upload, 1 hr download |
| No internal keys exposed | Init returns `uploadUrl` only (no storage key) |

---

## 12. Database

No schema migration required — uses existing tables from Phase 0:

| Table | Phase 3 usage |
|---|---|
| `guest_sessions` | Name + hashed token + event FK |
| `upload_batches` | Batch tracking + `upload_session_id` |
| `media_assets` | Original metadata + status lifecycle |
| `media_variants` | THUMB + WEB records after processing |
| `events` | `storage_used_bytes` increment on complete |

---

## 13. Environment Variables

| Variable | Purpose |
|---|---|
| `REDIS_URL` | BullMQ connection |
| `DATABASE_URL` | Prisma (API + worker) |
| `STORAGE_*` | MinIO/R2 credentials |
| `APP_ENV` | Storage key prefix |
| `GUEST_SESSION_COOKIE` | Cookie name (default: `memopics_guest`) |

See [`.env.example`](../.env.example).

---

## 14. File Structure

```
packages/domain/src/
├── media/
│   ├── mime.utils.ts
│   ├── storage-quota.utils.ts
│   └── image-processing.constants.ts
└── queue/
    └── media-job.types.ts

packages/shared/src/
└── queue.constants.ts

packages/storage/src/
└── s3-storage.service.ts          # + getObjectBuffer, putObject

apps/api/src/
├── public/
│   ├── guest-sessions.controller.ts
│   ├── guest-sessions.service.ts
│   ├── guest-session.guard.ts
│   └── dto/guest-session.dto.ts
├── uploads/
│   ├── uploads.controller.ts
│   ├── uploads.service.ts
│   └── dto/upload.dto.ts
└── queue/
    ├── media-queue.service.ts
    └── queue.module.ts

apps/worker-media/src/
├── index.ts
├── load-env.ts
└── media-processor.ts
```

---

## 15. Testing Strategy

### Implemented

| Layer | Coverage |
|---|---|
| Domain | MIME detect, mime match, storage quota (20 tests total) |
| Build | `pnpm build` — 8/8 packages |

### Planned (Phase 6)

| Layer | Coverage |
|---|---|
| Integration | Upload init/complete with mocked storage |
| Integration | Guest session cookie + guard |
| E2E | Full upload → worker → ACTIVE status |

---

## 16. Out of Scope (Deferred)

| Item | Phase |
|---|---|
| Guest upload UI | Phase 4 |
| Gallery API + pagination | Phase 4 |
| Couple media list/delete | Phase 5 |
| Rate limiting middleware | Phase 6 |
| Orphan PENDING cleanup | Phase 3+ maintenance |
| IP-based session rate limit (10/hr) | Phase 6 |

---

## 17. Local Verification

```bash
pnpm docker:up
pnpm db:migrate:deploy

# Terminal 1 — API
pnpm --filter @memopics/api dev

# Terminal 2 — Worker
pnpm --filter @memopics/worker-media dev
```

### Full curl flow (after couple creates event)

```bash
# 1. Guest session
curl -X POST http://localhost:3001/v1/public/events/demetris-daniella/guest-session \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Maria"}' \
  -c guest.txt

# 2. Init upload
curl -X POST http://localhost:3001/v1/public/events/demetris-daniella/uploads/init \
  -H "Content-Type: application/json" \
  -b guest.txt \
  -d '{
    "uploadSessionId": "test-session-1",
    "files": [{
      "clientFileId": "f1",
      "contentType": "image/jpeg",
      "contentLength": 12345
    }]
  }'

# 3. PUT file to uploadUrl from step 2

# 4. Complete
curl -X POST http://localhost:3001/v1/public/events/demetris-daniella/uploads/{batchId}/complete \
  -H "Content-Type: application/json" \
  -b guest.txt \
  -d '{}'

# 5. Check worker logs — media should reach ACTIVE
```

---

## Document Map (Stage 3 phases)

| Phase | Document |
|---|---|
| 2 — Events | [STAGE_3_PHASE_2_EVENTS.md](./STAGE_3_PHASE_2_EVENTS.md) |
| **3 — Upload Pipeline** | **This document** + [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md) |
| 4 — Guest UX | *(pending)* |

---

**Next:** [Phase 4 — Guest Experience](./STAGE_3_MVP_PLAN.md#phase-4--guest-experience-day-7–9)

---

## Phase 3 Scalability Hardening Review (2026-07-20)

**Status:** ✅ **Approved for Phase 4** — code hardening complete; live verification passed (10/10).

See also: [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md)

### Live verification (2026-07-20, Docker + API + worker-media)

Run: `node scripts/phase3-hardening-verify.mjs` (requires `pnpm docker:up`, migrations, API, worker).

| # | Check | Result |
|---|---|---|
| 1 | Health endpoint + queue metrics | **Pass** |
| 2 | Public event by slug | **Pass** |
| 3 | Guest session create + cookie | **Pass** |
| 4 | Upload init (presigned URLs) | **Pass** |
| 5 | Presigned PUT to MinIO | **Pass** |
| 6 | Upload complete | **Pass** |
| 7 | Worker → media `ACTIVE` | **Pass** |
| 8 | MinIO bucket private (anon GET → 403) | **Pass** |
| 9 | Phase 3 DB indexes present | **Pass** |
| 10 | Guest session rate limit (429 burst) | **Pass** |

**Blockers fixed during verification:**

- Removed UTF-8 BOM from `20260320120000_init` migration SQL (Prisma deploy was failing)
- `db:test` now loads `.env` from package + repo root
- API `main.ts`: use `app.listen()` return value for `setTimeout` (Express app has no `setTimeout`)
- Guest session DTO: value import in controller (`import type` broke ValidationPipe metadata)

### Production scenario validated

| Scenario | Mitigation |
|---|---|
| 400+ guests / wedding | Event-scoped sessions, per-session limits, horizontal workers |
| Multiple concurrent weddings | Event-isolated storage paths + DB queries by eventId |
| Thousands of guest sessions | Indexes on `guest_sessions(event_id, created_at)` |
| Burst uploads (first dance) | Redis rate limits, queue buffering, configurable worker concurrency |

### Fixes applied in hardening pass

1. Redis-backed global API rate limit (120 req/min/IP)
2. Guest session creation rate limit (10/hr/IP)
3. Upload init rate limit (30/hr/session) + complete (60/hr/session)
4. Guest hourly photo limit now accounts for batch size
5. Storage quota race fix (`SELECT FOR UPDATE` on event row)
6. Storage key path validation per event
7. MinIO anonymous download removed (private bucket like R2)
8. DB composite indexes for gallery, hourly limits, queue queries
9. Worker `WORKER_MEDIA_CONCURRENCY` env var
10. Queue duplicate job prevention + enqueue failure logging
11. Worker marks FAILED only after final retry attempt
12. Global exception filter + Helmet + 30s request timeout
13. Slow request logging (>3s)
14. Metric hooks: upload init/complete/failed, queue size, worker jobs, storage usage
15. Health endpoint includes queue counts

