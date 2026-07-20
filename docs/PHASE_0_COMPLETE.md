# Phase 0 — Foundation Complete

**Date:** Stage 3 implementation  
**Status:** Complete

## Deliverables

| Item | Location |
|---|---|
| Turborepo monorepo | Root `package.json`, `pnpm-workspace.yaml`, `turbo.json` |
| Expo archived | `legacy/expo/` |
| Prisma schema | `packages/database/prisma/schema.prisma` |
| Storage abstraction | `packages/domain/src/storage/storage-service.interface.ts` |
| S3 implementation | `packages/storage/src/s3-storage.service.ts` |
| Structured logging | `packages/logging/src/logger.ts` |
| Docker Compose | `docker/docker-compose.yml` |
| API stub | `apps/api/` — health + request logging |
| Web stub | `apps/web/` — Next.js 15 |
| Worker stub | `apps/worker-media/` |

## Schema Highlights (v1.1 adjustments)

- **Timestamps:** `created_at`, `updated_at` on all important tables
- **Soft delete:** `deleted_at` on users, events, guest_sessions, upload_batches, media_assets
- **Event status:** `ACTIVE`, `EXPIRED`, `DELETED` (lifecycle ready; logic in later phases)
- **Media types:** `PHOTO`, `VIDEO`, `AI_OUTPUT` (MVP implements PHOTO only)

## Logging Categories

| Category | Helper |
|---|---|
| Request | `logRequest()` |
| Upload errors | `logUploadError()` |
| Worker errors | `logWorkerError()` |

## Next: Phase 1 — API Core

1. Magic link auth
2. Domain use cases
3. Auth guards

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:generate
pnpm db:push
pnpm dev
```
