# Environment Variables

Copy `.env.example` to `.env` at the repository root before running any app.

## Required for Phase 0–1

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://memopics:memopics@localhost:5432/memopics` |
| `NODE_ENV` | Yes | Runtime environment | `development` |
| `APP_ENV` | Yes | App environment label (storage paths) | `development` |
| `API_PORT` | Yes | NestJS listen port | `3001` |
| `WEB_APP_URL` | Yes | Next.js origin (CORS + magic links) | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Phase 1+ | Access token signing secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Phase 1+ | Refresh token signing secret | — |
| `MAGIC_LINK_TTL_MINUTES` | Phase 1+ | Magic link expiry | `15` |

## Infrastructure (Docker)

| Variable | Required | Description | Example |
|---|---|---|---|
| `REDIS_URL` | Phase 3+ | BullMQ queue | `redis://localhost:6379` |
| `STORAGE_ENDPOINT` | Phase 3+ | S3-compatible endpoint | `http://localhost:9000` |
| `STORAGE_REGION` | Phase 3+ | Storage region | `us-east-1` |
| `STORAGE_BUCKET` | Phase 3+ | Bucket name | `memopics` |
| `STORAGE_ACCESS_KEY_ID` | Phase 3+ | Access key | `minioadmin` |
| `STORAGE_SECRET_ACCESS_KEY` | Phase 3+ | Secret key | `minioadmin` |
| `STORAGE_FORCE_PATH_STYLE` | Phase 3+ | Path-style URLs (MinIO/R2) | `true` |

## Email (Phase 1+)

| Variable | Required | Description | Example |
|---|---|---|---|
| `SMTP_HOST` | Phase 1+ | SMTP server | `localhost` |
| `SMTP_PORT` | Phase 1+ | SMTP port | `1025` |
| `MAILPIT_WEB_URL` | Dev | Mailpit UI | `http://localhost:8025` |

## Cookies (Phase 1+)

| Variable | Default | Description |
|---|---|---|
| `ACCESS_TOKEN_COOKIE` | `memopics_access` | HTTP-only access cookie name |
| `REFRESH_TOKEN_COOKIE` | `memopics_refresh` | HTTP-only refresh cookie name |
| `GUEST_SESSION_COOKIE` | `memopics_guest` | Guest session cookie name |

## Logging

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | Pino log level |
| `SERVICE_NAME` | `memopics` | Service identifier in logs |

## Production (R2)

See commented block in `.env.example` for Cloudflare R2 configuration.
