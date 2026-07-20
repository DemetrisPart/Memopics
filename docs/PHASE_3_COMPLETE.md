# Phase 3 — Storage & Upload Pipeline Complete

**Full specification:** [STAGE_3_PHASE_3_STORAGE_UPLOAD.md](./STAGE_3_PHASE_3_STORAGE_UPLOAD.md)

## Endpoints Added

### Guest session (public — no prior auth)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/public/events/:slug/guest-session` | Create guest session + set cookie |

### Guest uploads (guest cookie required)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/public/events/:slug/uploads/init` | Presigned upload URLs for batch |
| POST | `/v1/public/events/:slug/uploads/:batchId/complete` | Verify uploads + enqueue processing |

## Infrastructure

| Component | Location |
|---|---|
| Storage `getObjectBuffer` / `putObject` | `packages/storage` |
| MIME sniffing + quota checks | `packages/domain/src/media/` |
| BullMQ producer | `apps/api/src/queue/` |
| Sharp worker consumer | `apps/worker-media/` |

## Media lifecycle

```
PENDING → (complete + verify) → PROCESSING → (worker) → ACTIVE
                         ↘ QUARANTINED (MIME/exists fail)
                         ↘ FAILED (worker error after retries)
```

## Local dev

```bash
pnpm docker:up
pnpm db:migrate:deploy
pnpm --filter @memopics/api dev          # terminal 1
pnpm --filter @memopics/worker-media dev # terminal 2
```

### Hardening verification

```bash
node scripts/phase3-hardening-verify.mjs
```

Last run: **10/10 passed** (2026-07-20) — health, upload pipeline, worker processing, MinIO privacy, indexes, rate limits.

## Next: Phase 4 — Guest Experience (Next.js UI)
