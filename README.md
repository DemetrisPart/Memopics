# Memopics

Premium event memory platform — guests scan QR, upload photos, couples manage galleries.

## Monorepo Structure

```
memopics/
├── apps/
│   ├── web/              # Next.js 15 — guest pages + couple dashboard
│   ├── api/              # NestJS REST API
│   └── worker-media/     # Image processing worker (BullMQ + Sharp)
├── packages/
│   ├── database/         # Prisma schema + client
│   ├── domain/           # StorageService interface + domain types
│   ├── storage/          # S3-compatible storage (R2 / MinIO)
│   ├── logging/          # Structured logging (request, upload, worker)
│   └── shared/           # Constants + shared types
├── docker/               # Local dev infrastructure
├── docs/                 # Architecture + stage documentation
└── legacy/expo/          # Archived Expo scaffold (do not use)
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for Postgres, Redis, MinIO, Mailpit)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Start local infrastructure
pnpm docker:up

# 4. Generate Prisma client + apply migrations
pnpm db:generate
pnpm docker:up
pnpm db:migrate:deploy
pnpm db:test

# 5. Build packages
pnpm build

# 6. Start all apps in dev mode
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API health | http://localhost:3001/v1/health |
| MinIO console | http://localhost:9001 (minioadmin / minioadmin) |
| Mailpit | http://localhost:8025 |

## Phase 0 Deliverables

- [x] Turborepo monorepo (pnpm)
- [x] Expo moved to `legacy/expo/`
- [x] Prisma schema with timestamps, soft delete, event lifecycle, media types
- [x] `StorageService` abstraction (`@memopics/domain` + `@memopics/storage`)
- [x] Structured logging (`@memopics/logging`)
- [x] Docker Compose (Postgres, Redis, MinIO, Mailpit)
- [x] App stubs: web, api, worker-media

## Documentation

- [Master Prompt](docs/MASTER_PROMPT.md)
- [Stage 1 Architecture](docs/STAGE_1_ARCHITECTURE.md)
- [Stage 2 UI/UX Design](docs/STAGE_2_UI_UX_DESIGN.md)
- [Stage 3 MVP Plan](docs/STAGE_3_MVP_PLAN.md)

## License

See [LICENSE](LICENSE).
