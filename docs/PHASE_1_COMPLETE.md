# Phase 1 — API Core Complete

## Verification Fixes (pre-Phase 1)

| Check | Result |
|---|---|
| Prisma migrations | Initial migration `20260320120000_init` added |
| DB connection test | `pnpm db:test` script added |
| Env documentation | `docs/ENV.md` + `.env.example` |
| Docker | Compose file present; requires Docker Desktop on dev machine |
| Phase 0 business logic | Confirmed none in apps (health + logging only) |

## Phase 1 Deliverables

### Auth Endpoints (`/v1/auth/*`)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/auth/register` | Create couple account + send magic link |
| POST | `/v1/auth/magic-link` | Resend magic link (existing users) |
| POST | `/v1/auth/verify` | Verify token → set HTTP-only cookies |
| POST | `/v1/auth/refresh` | Rotate session via refresh cookie |
| POST | `/v1/auth/logout` | Revoke refresh token + clear cookies |
| GET | `/v1/me` | Current user profile (JWT required) |

### Implementation

- Magic link tokens hashed (SHA-256) in DB
- JWT access (15 min) + refresh (7 days) in HTTP-only cookies
- Refresh token rotation with DB revocation
- Soft-delete aware user lookups
- Email via SMTP (Mailpit in local dev)
- `JwtAuthGuard` for protected routes
- Health check includes database status

### Domain Layer

- `@memopics/domain` — `AuthTokens`, `JwtPayload`, `StorageService` interface

## Local Test Flow

```bash
pnpm docker:up
pnpm db:migrate:deploy
pnpm db:test
pnpm --filter @memopics/api dev

# Register
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"couple@example.com"}'

# Check Mailpit http://localhost:8025 for magic link token
# Verify
curl -X POST http://localhost:3001/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-email>"}' \
  -c cookies.txt

# Me
curl http://localhost:3001/v1/me -b cookies.txt
```

## Next: Phase 2 — Events

- Create/update event
- Slug validation
- QR code generation
