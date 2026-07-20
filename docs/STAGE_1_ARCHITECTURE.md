# Stage 1 — System Architecture

**Project:** Memopics  
**Status:** Architecture design only — no implementation code  
**Approved inputs:** Stage 0 decisions (Cyprus/Greece launch, GDPR, €29/€59/€129 pricing, 100 GB Premium cap, analysis-based AI, B2C first with B2B-ready design)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Comparisons & Recommendations](#2-technology-comparisons--recommendations)
3. [Cloud Architecture](#3-cloud-architecture)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Security Architecture](#6-security-architecture)
7. [Folder Structure](#7-folder-structure)
8. [Key Flows](#8-key-flows)
9. [Deployment & Environments](#9-deployment--environments)
10. [Testing Strategy](#10-testing-strategy)
11. [Stage 1 Decisions Requiring Approval](#11-stage-1-decisions-requiring-approval)

---

## 1. Architecture Overview

### 1.1 Architectural Style

**Modular monolith API + separate worker services** in a **Turborepo monorepo**.

| Layer | Responsibility |
|---|---|
| **Web App** | Marketing, event landing pages, guest upload UX, couple dashboard, platform admin |
| **API** | Auth, events, billing, permissions, presigned uploads, webhooks |
| **Media Worker** | Image variants, video transcoding (HLS), virus scan, ZIP export |
| **AI Worker** | Duplicate detection, best shot, face grouping, highlights, reels |
| **Scheduler Worker** | Expiration reminders, grace-period deletion, cleanup jobs |

This avoids premature microservices complexity while keeping **CPU-heavy workloads isolated** from the request/response API.

### 1.2 High-Level Diagram

```
                                    ┌─────────────────┐
                                    │  Cloudflare CDN │
                                    │  + WAF + DNS    │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
     ┌────────────────┐            ┌─────────────────┐           ┌─────────────────┐
     │  Next.js Web   │            │   NestJS API    │           │  Cloudflare R2  │
     │  (SSR / PWA)   │◄──────────►│   (REST + JWT)  │──────────►│  Object Storage │
     └────────────────┘            └────────┬────────┘           └─────────────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         │                  │                  │
                         ▼                  ▼                  ▼
                  ┌────────────┐      ┌────────────┐     ┌────────────┐
                  │ PostgreSQL │      │   Redis    │     │   Stripe   │
                  │  (Neon EU) │      │ (Upstash)  │     │  Payments  │
                  └────────────┘      └─────┬──────┘     └────────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
                  ┌────────────┐      ┌────────────┐     ┌────────────┐
                  │   Media    │      │     AI     │     │ Scheduler  │
                  │   Worker   │      │   Worker   │     │   Worker   │
                  │  (FFmpeg)  │      │ (ML jobs)  │     │ (cron/queue)│
                  └────────────┘      └────────────┘     └────────────┘
```

### 1.3 Design Principles Applied

- **Clean Architecture:** domain logic in `packages/domain`, infrastructure adapters swappable
- **Event isolation:** every query scoped by `event_id`; storage paths namespaced
- **Direct-to-storage uploads:** API never proxies file bytes
- **Admin-configurable commerce:** plans, prices, extensions stored in DB (Stripe sync)
- **Global-ready:** i18n hooks, EU data residency default, multi-currency ready
- **B2B-ready:** `organizations` and `organization_members` from schema v1 (nullable until used)

### 1.4 Existing Repo Note

The workspace contains an **Expo 57 starter** (`src/app/`). Stage 1 recommends **migrating to a Turborepo with Next.js** as the primary product surface. Expo is not suitable as the core SaaS web platform (SEO, luxury web UX, admin dashboards, upload reliability). The Expo scaffold may be archived or repurposed later for an optional native companion — not MVP.

---

## 2. Technology Comparisons & Recommendations

### 2.1 Frontend Framework

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **Next.js 15 (App Router)** ✅ | SSR for `memopics.com/[slug]` SEO; PWA; React ecosystem; middleware; image optimization; industry SaaS standard | New scaffold vs existing Expo; learning App Router patterns | Excellent on Vercel Edge + ISR | Free → ~$20–500/mo |
| **Expo Web** | Already in repo; shared code if native app later | Weak SEO; RN Web limitations for luxury design; upload UX gaps; atypical for SaaS admin | Moderate | Low |
| **Remix** | Strong routing/data loading | Smaller admin SaaS ecosystem; fewer Cyprus/EU hiring resources | Good | Similar to Next |

**Recommendation:** **Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui**

**Rationale:** Event landing pages must load instantly on mobile Safari after QR scan. SSR + CDN caching is critical. Premium positioning requires fine-grained web typography and layout control.

---

### 2.2 Backend / API Framework

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **NestJS** ✅ | Modules, DI, guards, Clean Architecture fit; B2B/white-label APIs; OpenAPI; testable | Separate deployable; more boilerplate than Next API routes | Excellent horizontal scaling | Worker + API ~$30–200/mo |
| **Next.js Route Handlers only** | Single deploy; fast MVP | Long-running logic temptation; mixed concerns; harder B2B API versioning | Good for read-heavy | Bundled with Vercel |
| **FastAPI (Python)** | Best ML library ecosystem | Two languages; split team expertise | Good for AI workers only | Extra service |

**Recommendation:** **NestJS REST API** (separate `apps/api`) + **Next.js** consumes API internally and via public REST.

**Rationale:** Payments, webhooks, multi-tenant auth, and future B2B/white-label partner APIs benefit from a dedicated, versioned API layer. Workers share `packages/domain` with the API.

---

### 2.3 Database

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **PostgreSQL (Neon EU)** ✅ | Relational integrity; JSONB; EU regions; branching for staging; mature | Requires migration discipline | 1M+ rows with proper indexes | Free → ~$25–100/mo |
| **Supabase (Postgres only)** | Auth/realtime built-in | Temptation to use Supabase Storage (conflicts with R2 strategy) | Good | ~$25+/mo |
| **MongoDB** | Flexible docs | Weak for billing/plans/permissions joins | Moderate | Variable |
| **PlanetScale (MySQL)** | Scaling | FK limitations; less ideal for complex tenant model | High | Variable |

**Recommendation:** **PostgreSQL 16 on Neon (Frankfurt or EU region)** with **Prisma ORM** + versioned migrations.

**GDPR:** Primary DB in EU. Neon supports EU residency. DPA required.

---

### 2.4 Object Storage + CDN

| Option | Advantages | Disadvantages | Scale | Cost (typical wedding platform) |
|---|---|---|---|---|
| **Cloudflare R2 + CDN** ✅ | Zero egress; S3-compatible; global CDN; WAF integration | Custom transcoding pipeline | Excellent | ~$0.015/GB storage; egress $0 |
| **AWS S3 + CloudFront** | MediaConvert, Rekognition native | Egress dominates cost at gallery scale | Excellent | Storage cheap; egress expensive |
| **Backblaze B2 + CF CDN** | Cheapest raw storage | Extra integration; less unified | Good | Very low storage |
| **Supabase Storage** | Simple | Not ideal for direct guest upload at scale; egress costs | Moderate | Grows with usage |

**Recommendation:** **Cloudflare R2** for all media + **Cloudflare CDN** for delivery.

**Cost implication:** At 10 TB/month gallery delivery, R2 saves ~€900+/month vs S3 egress alone.

**Storage path convention:**
```
/{env}/events/{eventId}/originals/{mediaId}.{ext}
/{env}/events/{eventId}/images/{mediaId}/thumb.webp
/{env}/events/{eventId}/images/{mediaId}/web.webp
/{env}/events/{eventId}/videos/{mediaId}/hls/master.m3u8
/{env}/events/{eventId}/exports/{exportId}.zip
/{env}/events/{eventId}/ai/{jobId}/output.mp4
```

---

### 2.5 Image Processing

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **Sharp (Node worker)** ✅ | Fast; self-hosted; full control | Worker CPU needed | High throughput with horizontal workers | Compute only |
| **Cloudinary** | Managed transforms | Per-transformation cost explodes | High | $$$ at scale |
| **imgproxy** | Go, efficient | Extra service to operate | High | Low compute |

**Recommendation:** **Sharp** in Media Worker — thumbnail (400px), web (2048px max, WebP/AVIF).

---

### 2.6 Video Processing

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **FFmpeg on Fly.io/ECS workers** ✅ | Full control; HLS; HEVC/HDR ingest | Ops complexity | Scale workers horizontally | ~€4–12/event typical |
| **AWS MediaConvert** | Managed; reliable HDR | Per-minute cost | AWS-scale | Higher per minute |
| **Mux** | Turnkey streaming | Expensive | Excellent | Premium pricing |

**Recommendation:** **FFmpeg self-hosted workers** (primary) with **AWS MediaConvert** as optional fallback for problematic HEVC/HDR files.

**Output:** HLS (360p/720p/1080p adaptive), poster thumbnail, duration metadata.

---

### 2.7 Background Jobs / Queue

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **BullMQ + Redis** ✅ | Mature; retries; priorities; delayed jobs (reminders) | Redis ops | Proven at high volume | Upstash ~$10–50/mo |
| **AWS SQS + Lambda** | Serverless | Cold starts; FFmpeg ill-suited for Lambda | Good for light jobs | Pay per use |
| **Inngest** | Great DX | Vendor lock-in; less control for FFmpeg | Good | Usage-based |

**Recommendation:** **BullMQ + Redis (Upstash EU)** with named queues: `media`, `ai`, `notifications`, `maintenance`.

---

### 2.8 Authentication

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **Auth.js + magic link (custom)** ✅ | Full white-label control; no vendor branding; couples magic link | More implementation | Unlimited users | Email cost only |
| **Clerk** | Fast setup; MFA | White-label limitations; cost at scale; branding | High | $25–500+/mo |
| **Supabase Auth** | Integrated | Couples with Supabase stack | Good | Bundled |

**Recommendation:**

| Actor | Auth mechanism |
|---|---|
| **Couple (owner)** | Magic link email + optional password; JWT access + refresh rotation |
| **Platform admin** | Email + password + MFA (TOTP) |
| **Guest** | Name entry → event-scoped session cookie (HTTP-only, signed, 24h TTL, renewable) |
| **Future B2B org admin** | Same as couple + organization membership RBAC |

Guests do **not** get accounts. Guest identity = `{ guestSessionId, displayName, eventId }`.

---

### 2.9 Payments

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **Stripe** ✅ | Cyprus/EU; one-time Checkout; webhooks; Customer Portal; Tax | 2.9% + €0.25 | Global | Transaction fees |
| **Paddle** | Merchant of record | Less flexible for extensions model | Good | Higher fees |
| **PayPal** | Known in GR/CY | Weaker SaaS tooling | Moderate | Fees |

**Recommendation:** **Stripe Checkout (one-time)** + **Stripe webhooks**.

**Admin-configurable pricing:** Plans/prices in PostgreSQL. On admin price change → create/update Stripe Product + Price via API (`lookup_key` = plan slug). Checkout reads live DB price → Stripe Price ID. **No code deploy needed for price changes.**

---

### 2.10 Email / Notifications

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **Resend** ✅ | Modern API; good deliverability | EU DPA needed | High volume OK | Free tier → paid |
| **Postmark** | Excellent deliverability | Slightly higher cost | High | Paid |
| **AWS SES** | Cheap | Setup complexity | Very high | Very low |

**Recommendation:** **Resend** for transactional (expiration reminders, upload notifications, AI complete).

**i18n:** Templates in EN + EL (Greek) from launch for CY/GR market.

---

### 2.11 Virus Scanning

| Option | Advantages | Disadvantages | Scale | Cost |
|---|---|---|---|---|
| **ClamAV on media worker** ✅ | No per-file API cost | Maintenance | Scale with workers | Compute only |
| **VirusTotal API** | Multi-engine | Privacy concern; API limits; cost | Moderate | Per file |
| **Cloudflare Gateway** | Network level | Not file-content scan | N/A | Bundled |

**Recommendation:** **ClamAV** scan after upload completes, before marking media `active`. Infected → quarantine + notify couple.

---

### 2.12 AI / ML Stack (Analysis & Editing Only)

| Component | Recommended approach | Avoid |
|---|---|---|
| Duplicate detection | Perceptual hash (pHash) + embedding similarity (CLIP-style, self-hosted or Replicate batch) | Generative models |
| Best shot | Sharpness/exposure/face-quality scoring | — |
| Face grouping | `insightface` or AWS Rekognition (optional premium accuracy) | — |
| Highlight generation | Scene detection + motion/smile scoring + FFmpeg concat | Sora/Veo/Kling |
| Reel (9:16) | Auto crop/reframe existing clips + transitions + music bed | Generative video |
| Slideshow | Ken Burns on selected photos + music | — |

**Recommendation:** **Python sidecar optional** for heavy ML (`apps/ai-worker-py`) OR pure Node + FFmpeg + `@tensorflow/tfjs-node` for MVP AI v1. Start Node-only for dedup/best-shot; add Python worker in Stage 6 if needed.

---

### 2.13 Hosting & Infrastructure

| Component | Recommendation | Region |
|---|---|---|
| Web (Next.js) | Vercel | EU (Frankfurt) |
| API (NestJS) | Fly.io or Railway | EU (Frankfurt/Amsterdam) |
| Workers | Fly.io (CPU-optimized machines) | EU |
| PostgreSQL | Neon | EU (Frankfurt) |
| Redis | Upstash | EU |
| R2 + CDN + WAF | Cloudflare | Global edge |
| DNS | Cloudflare | — |

**Cost at launch (50 events/month):** ~€150–350/month infra  
**Cost at 500 events/month:** ~€800–2,000/month (video-heavy weekends)

---

### 2.14 Recommended Stack Summary

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm |
| Language | TypeScript (strict); Python optional for AI Stage 6 |
| Web | Next.js 15, Tailwind, shadcn/ui, next-intl |
| API | NestJS, Prisma, class-validator, OpenAPI |
| DB | PostgreSQL 16 (Neon EU) |
| Cache/Queue | Redis (Upstash EU), BullMQ |
| Storage | Cloudflare R2 |
| CDN/WAF | Cloudflare |
| Auth | Auth.js patterns + custom guest sessions |
| Payments | Stripe |
| Email | Resend |
| Media | Sharp + FFmpeg workers |
| Monitoring | Sentry + Axiom/Grafana Cloud + uptime checks |
| CI/CD | GitHub Actions |

---

## 3. Cloud Architecture

### 3.1 Environments

| Environment | Purpose |
|---|---|
| `development` | Local Docker (Postgres, Redis, MinIO/R2 dev) |
| `staging` | Full cloud mirror; test Stripe mode |
| `production` | Live CY/GR launch |

### 3.2 Multi-Tenancy Model

```
Platform
 └── Organizations (nullable — future B2B)
      └── Users (couples, planners, admins)
           └── Events
                └── Guest Sessions
                     └── Media Assets
```

**Isolation rules:**
- All DB queries include `event_id` (and `organization_id` when applicable)
- R2 presigned URLs scoped to exact object key + short TTL (15 min upload, 1h download)
- API middleware validates event membership before any event resource access
- Row Level Security (RLS) optional defense-in-depth on PostgreSQL

### 3.3 Upload Architecture (Direct to R2)

```
Guest Browser                    API                         R2
     │                            │                           │
     │── POST /uploads/init ─────►│                           │
     │◄─ presigned PUT URLs ──────│                           │
     │                            │                           │
     │── PUT file (direct) ───────┼──────────────────────────►│
     │                            │                           │
     │── POST /uploads/complete ─►│── enqueue media job ─────►│
     │                            │                           │
     │                            │     Media Worker          │
     │                            │◄── scan + process ────────│
```

- **Multipart upload** for files > 10 MB
- **Client-side:** max 10 photos + 5 videos per batch (per spec)
- **Server-side:** plan storage quota enforcement before presign

### 3.4 Event Lifecycle & Expiration

| State | Behavior |
|---|---|
| `active` | Uploads allowed; gallery accessible per privacy setting |
| `expiring_soon` | Reminders at T-7 days and T-24 hours |
| `expired` | Uploads blocked; couple read-only access |
| `grace_period` | 14 days post-expiration; extension still purchasable |
| `pending_deletion` | Final warning email |
| `deleted` | All R2 objects + DB records purged (GDPR erasure) |

**Extensions ( purchasable anytime before deletion ):**
- +7 days hosting
- +30 days hosting
- +GB storage packs (configurable in admin)
- AI feature upgrades

### 3.5 Future White-Label (Architecture Hook)

- `organizations.custom_domain` → Cloudflare for SaaS SSL
- `organizations.brand_config` JSON (logo, colors, hide Memopics branding)
- Route: `custom.domain/[slug]` → same event engine

Not built in MVP; schema and API versioning prepared.

---

## 4. Database Design

### 4.1 Entity Relationship Summary

**Core entities:** `users`, `organizations`, `organization_members`, `events`, `event_settings`, `guest_sessions`, `media_assets`, `media_variants`, `upload_batches`, `plans`, `plan_prices`, `purchases`, `purchase_items`, `event_subscriptions`, `ai_jobs`, `export_jobs`, `notifications`, `audit_logs`, `platform_settings`

### 4.2 Key Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR NULL | Optional |
| role | ENUM | `couple`, `platform_admin`, `org_admin`, `org_member` |
| locale | VARCHAR | `en`, `el` |
| email_verified_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

#### `organizations` (B2B-ready)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| type | ENUM | `planner`, `photographer`, `corporate`, `venue` |
| custom_domain | VARCHAR NULL | White-label future |
| brand_config | JSONB | Logo, colors |
| stripe_customer_id | VARCHAR NULL | |
| created_at | TIMESTAMPTZ | |

#### `events`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Internal ID — never exposed in URLs |
| slug | VARCHAR UNIQUE | `demetris-daniella` — URL slug |
| qr_token | VARCHAR UNIQUE | Rotatable secret for QR validation |
| owner_user_id | UUID FK | |
| organization_id | UUID FK NULL | Future B2B |
| event_type | ENUM | `wedding`, `baptism`, `corporate`, ... |
| bride_name | VARCHAR NULL | Theme-specific JSON alternative later |
| groom_name | VARCHAR NULL | |
| title | VARCHAR | Display name |
| event_date | DATE | |
| cover_image_media_id | UUID FK NULL | |
| status | ENUM | `draft`, `active`, `expired`, `grace`, `deleted` |
| privacy_mode | ENUM | `own_uploads_only`, `all_guests` |
| expires_at | TIMESTAMPTZ | |
| grace_ends_at | TIMESTAMPTZ | expires_at + 14 days |
| storage_used_bytes | BIGINT | Denormalized counter |
| storage_limit_bytes | BIGINT | From plan + extensions |
| plan_id | UUID FK | |
| locale | VARCHAR | Event page language |
| created_at | TIMESTAMPTZ | |

**Indexes:** `slug`, `qr_token`, `owner_user_id`, `expires_at`, `status`

#### `guest_sessions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| event_id | UUID FK | |
| display_name | VARCHAR | Guest-entered name |
| session_token_hash | VARCHAR | |
| ip_hash | VARCHAR | Privacy-preserving abuse detection |
| last_seen_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

#### `media_assets`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| event_id | UUID FK | |
| guest_session_id | UUID FK NULL | NULL if uploaded by owner |
| upload_batch_id | UUID FK | |
| type | ENUM | `photo`, `video` |
| status | ENUM | `pending`, `scanning`, `processing`, `active`, `failed`, `quarantined` |
| original_key | VARCHAR | R2 path |
| original_size_bytes | BIGINT | |
| mime_type | VARCHAR | |
| width | INT NULL | |
| height | INT NULL | |
| duration_ms | INT NULL | Videos |
| metadata | JSONB | EXIF (stripped of sensitive GPS unless opted in) |
| created_at | TIMESTAMPTZ | |

#### `media_variants`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| media_asset_id | UUID FK | |
| variant | ENUM | `thumb`, `web`, `hls_360`, `hls_720`, `hls_1080`, `poster` |
| storage_key | VARCHAR | |
| size_bytes | BIGINT | |

#### `plans`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| slug | VARCHAR UNIQUE | `basic`, `standard`, `premium` |
| name | JSONB | i18n labels |
| storage_bytes | BIGINT | |
| duration_days | INT | |
| features | JSONB | Feature flags |
| is_active | BOOLEAN | |
| sort_order | INT | |

#### `plan_prices`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| plan_id | UUID FK | |
| currency | VARCHAR | `EUR` |
| amount_cents | INT | Admin-editable |
| stripe_product_id | VARCHAR | |
| stripe_price_id | VARCHAR | Synced on change |
| effective_from | TIMESTAMPTZ | Allows scheduled price changes |
| is_current | BOOLEAN | |

#### `addon_products` (extensions)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| slug | VARCHAR | `extend_7d`, `extend_30d`, `storage_10gb`, `ai_highlights` |
| type | ENUM | `duration`, `storage`, `ai` |
| config | JSONB | `{ days: 7 }` or `{ bytes: 10737418240 }` |
| is_active | BOOLEAN | |

#### `addon_prices`
Same pattern as `plan_prices` — admin-configurable, Stripe-synced.

#### `purchases`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| event_id | UUID FK NULL | Set after event creation flow |
| stripe_checkout_session_id | VARCHAR | |
| stripe_payment_intent_id | VARCHAR | |
| status | ENUM | `pending`, `completed`, `refunded`, `failed` |
| total_cents | INT | |
| currency | VARCHAR | |
| created_at | TIMESTAMPTZ | |

#### `event_entitlements` (applied purchases)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| event_id | UUID FK | |
| source_purchase_id | UUID FK | |
| entitlement_type | ENUM | `plan`, `storage_addon`, `duration_addon`, `ai_addon` |
| value | JSONB | Applied delta |
| applied_at | TIMESTAMPTZ | |

#### `ai_jobs`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| event_id | UUID FK | |
| type | ENUM | `dedup`, `best_shot`, `face_group`, `highlights`, `reel`, `slideshow` |
| status | ENUM | `queued`, `processing`, `completed`, `failed` |
| config | JSONB | Duration target, music, etc. |
| output_media_id | UUID FK NULL | |
| error | TEXT NULL | |
| created_at | TIMESTAMPTZ | |

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| event_id | UUID FK NULL | |
| type | ENUM | `upload`, `ai_complete`, `expiry_7d`, `expiry_24h`, `zip_ready` |
| channel | ENUM | `email`, `in_app` |
| sent_at | TIMESTAMPTZ NULL | |
| scheduled_for | TIMESTAMPTZ | |

#### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| actor_user_id | UUID NULL | |
| event_id | UUID NULL | |
| action | VARCHAR | |
| metadata | JSONB | |
| ip_hash | VARCHAR | |
| created_at | TIMESTAMPTZ | |

### 4.3 Migration Strategy

- **Tool:** Prisma Migrate
- All changes versioned in `packages/database/prisma/migrations/`
- Backward-compatible additive migrations only in production
- No manual DB edits — ever

---

## 5. API Design

### 5.1 Conventions

- **Base URL:** `https://api.memopics.com/v1`
- **Format:** JSON REST
- **Auth:** `Authorization: Bearer <jwt>` (users); `X-Guest-Session: <token>` (guests)
- **Errors:** RFC 7807 Problem Details
- **Pagination:** cursor-based (`?cursor=&limit=`)
- **Idempotency:** `Idempotency-Key` header on POST purchase/upload-init
- **Rate limits:** Cloudflare WAF + API middleware per IP and per event

### 5.2 Public / Guest Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/public/events/:slug` | Event landing page data |
| POST | `/public/events/:slug/guest-session` | Create guest session (name) |
| POST | `/public/events/:slug/uploads/init` | Get presigned upload URLs |
| POST | `/public/events/:slug/uploads/:batchId/complete` | Finalize batch |
| GET | `/public/events/:slug/gallery` | Guest gallery (privacy-filtered) |
| GET | `/public/events/:slug/media/:id` | Signed media URL redirect |

### 5.3 Authenticated — Couple / Owner

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/magic-link` | Request login link |
| POST | `/auth/verify` | Verify magic link token |
| GET | `/me` | Current user |
| POST | `/events` | Create event (post-purchase) |
| GET | `/events` | List my events |
| GET | `/events/:id` | Event detail + stats |
| PATCH | `/events/:id` | Update settings, privacy, cover |
| GET | `/events/:id/qr` | QR code PNG/SVG + URL |
| GET | `/events/:id/media` | Full gallery (all uploads) |
| DELETE | `/events/:id/media/:mediaId` | Remove media |
| POST | `/events/:id/exports` | Request ZIP export |
| GET | `/events/:id/exports/:exportId` | Export status + download |
| POST | `/events/:id/ai-jobs` | Trigger AI job |
| GET | `/events/:id/ai-jobs` | AI job status |
| POST | `/events/:id/extend` | Purchase extension checkout |

### 5.4 Commerce

| Method | Endpoint | Description |
|---|---|---|
| GET | `/plans` | Active plans + current prices |
| GET | `/addons` | Available extensions |
| POST | `/checkout/plan` | Stripe Checkout session |
| POST | `/checkout/addon` | Extension checkout |
| POST | `/webhooks/stripe` | Stripe webhook handler |

### 5.5 Platform Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/analytics` | Platform stats |
| GET/POST/PATCH | `/admin/plans` | Manage plans |
| GET/POST/PATCH | `/admin/plan-prices` | Change prices (Stripe sync) |
| GET/POST/PATCH | `/admin/addon-products` | Manage extensions |
| GET | `/admin/events` | All events search |
| POST | `/admin/events/:id/extend` | Manual extension (support) |

### 5.6 Internal / Worker (private network)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/internal/media/process` | Triggered by queue consumer |
| POST | `/internal/ai/process` | AI worker callback |
| POST | `/internal/maintenance/expire-events` | Scheduler |

### 5.7 Web Routes (Next.js — not REST)

| Route | Purpose |
|---|---|
| `/` | Marketing homepage |
| `/pricing` | Plans (reads API) |
| `/[slug]` | Event landing page |
| `/[slug]/upload` | Guest upload flow |
| `/[slug]/gallery` | Guest gallery |
| `/dashboard` | Couple admin |
| `/dashboard/events/[id]` | Event management |
| `/admin` | Platform admin |
| `/auth/verify` | Magic link landing |

---

## 6. Security Architecture

### 6.1 Threat Model (Top Risks)

| Threat | Control |
|---|---|
| Cross-event data access | Event-scoped auth on every query; UUID internal IDs |
| Upload URL abuse | QR token validation; rate limits; CAPTCHA on abuse signals |
| Malware upload | ClamAV scan; MIME validation; size limits |
| Storage exhaustion | Quota check before presign; plan enforcement |
| DDoS on upload endpoints | Cloudflare WAF; per-IP limits |
| Guest PII (names) | GDPR consent notice; deletion with event |
| Token theft | Short-lived JWT; HTTP-only cookies; refresh rotation |

### 6.2 Encryption

| Layer | Method |
|---|---|
| In transit | TLS 1.3 everywhere (Cloudflare Full Strict) |
| At rest (DB) | Neon encryption at rest |
| At rest (R2) | Cloudflare encryption at rest |
| Secrets | Fly.io/Vercel secrets; never in repo |
| Signed URLs | HMAC-SHA256; 15 min – 1 hr TTL |

### 6.3 Access Control (RBAC)

| Role | Permissions |
|---|---|
| `guest` | Upload to event; view gallery per privacy mode |
| `couple` | Full event admin for owned events |
| `org_admin` | All events in organization (future) |
| `org_member` | Assigned events (future) |
| `platform_admin` | Platform settings, analytics, support actions |

### 6.4 GDPR Compliance Checklist

- [ ] Privacy Policy + Terms (EN + EL)
- [ ] Cookie consent (analytics only with consent)
- [ ] Data Processing Agreement with vendors (Neon, Cloudflare, Stripe, Resend)
- [ ] EU DB region default
- [ ] Guest name = personal data → minimal collection
- [ ] Right to erasure → event deletion pipeline
- [ ] Data export for couple on request
- [ ] EXIF GPS stripping by default
- [ ] Audit logs for admin actions
- [ ] DPO contact (when required)

### 6.5 Rate Limiting

| Endpoint class | Limit |
|---|---|
| Guest session create | 10 / hour / IP / event |
| Upload init | 30 / hour / guest session |
| Public event page | 300 / min / IP (CDN cached) |
| Auth magic link | 5 / hour / email |
| API general | 100 / min / user |

---

## 7. Folder Structure

```
memopics/
├── apps/
│   ├── web/                          # Next.js 15 — marketing, event pages, dashboards
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (marketing)/
│   │   │   │   ├── [slug]/           # Public event pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── admin/
│   │   │   │   └── auth/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── messages/             # i18n EN + EL
│   │   └── public/
│   │
│   ├── api/                          # NestJS REST API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── events/
│   │   │   │   ├── uploads/
│   │   │   │   ├── media/
│   │   │   │   ├── gallery/
│   │   │   │   ├── commerce/
│   │   │   │   ├── ai/
│   │   │   │   ├── exports/
│   │   │   │   ├── notifications/
│   │   │   │   └── admin/
│   │   │   ├── common/               # Guards, filters, pipes
│   │   │   └── main.ts
│   │   └── test/
│   │
│   ├── worker-media/                 # FFmpeg + Sharp + ClamAV
│   │   └── src/
│   │
│   ├── worker-ai/                    # AI analysis jobs (Stage 6)
│   │   └── src/
│   │
│   └── worker-scheduler/           # Expiration, reminders, cleanup
│       └── src/
│
├── packages/
│   ├── database/                     # Prisma schema + migrations + client
│   ├── domain/                       # Entities, use cases, interfaces (Clean Architecture)
│   ├── shared/                       # Types, constants, validators (Zod)
│   ├── storage/                      # R2 adapter (S3-compatible client)
│   ├── queue/                        # BullMQ queue definitions
│   └── email/                        # Resend templates
│
├── docs/
│   ├── MASTER_PROMPT.md
│   ├── STAGE_0_BUSINESS_ANALYSIS.md  # (to be saved from Stage 0)
│   ├── STAGE_1_ARCHITECTURE.md       # This document
│   └── ADR/                          # Architecture Decision Records
│
├── infra/
│   ├── docker/                       # Local dev compose
│   └── terraform/                    # Optional IaC (Stage 7)
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Note:** Existing Expo `src/app/` will be replaced/restructured during Stage 3 scaffold migration.

---

## 8. Key Flows

### 8.1 Couple Purchase → Event Creation

```
1. Couple selects plan on /pricing
2. POST /checkout/plan → Stripe Checkout
3. Stripe webhook → purchase completed
4. Couple creates event (names, date, slug)
5. System assigns plan entitlements (5/20/100 GB, duration)
6. QR code + URL generated
7. Event status → active
```

### 8.2 Guest Upload Flow

```
1. Scan QR → GET /[slug] (SSR event page)
2. Tap Upload → enter name → POST guest-session
3. Select files (≤10 photos, ≤5 videos)
4. POST uploads/init → presigned URLs (quota checked)
5. Browser PUTs directly to R2 with progress
6. POST uploads/complete → media job queued
7. Worker: scan → process → active
8. Couple notified (optional setting)
```

### 8.3 Expiration Flow

```
Scheduler daily:
  - T-7 days  → email reminder + in-app notification
  - T-1 day   → email reminder
  - expires_at → status expired, uploads blocked
  - grace_ends_at → pending_deletion warning
  - grace_ends_at + 7 days → purge R2 + anonymize DB
```

---

## 9. Deployment & Environments

| Service | Platform | Notes |
|---|---|---|
| web | Vercel | Preview deploys per PR |
| api | Fly.io | 2+ instances prod |
| workers | Fly.io | Auto-scale on queue depth |
| db | Neon | Branch for staging |
| redis | Upstash | |
| r2 | Cloudflare | Separate buckets per env |

**CI/CD (GitHub Actions):**
1. Lint + typecheck (Turborepo)
2. Unit tests
3. Integration tests (Testcontainers Postgres)
4. Deploy staging on `main` merge
5. Manual promote to production

---

## 10. Testing Strategy

| Layer | Approach |
|---|---|
| **Unit** | Jest/Vitest — domain use cases, validators, pricing logic |
| **Integration** | Supertest — API endpoints + Prisma test DB |
| **E2E** | Playwright — guest upload flow, checkout (Stripe test mode) |
| **Media worker** | Fixture files — verify thumbnail/HLS output |
| **Security** | OWASP ZAP in Stage 7; dependency scanning in CI |
| **Load** | k6 — 500 concurrent upload inits (Stage 7) |

---

## 11. Stage 1 Decisions Requiring Approval

Please confirm before Stage 2 (UI/UX) and Stage 3 (MVP build):

| # | Decision | Recommendation |
|---|---|---|
| 1 | Replace Expo scaffold with **Turborepo + Next.js + NestJS** | Recommended |
| 2 | **Cloudflare R2** for storage + CDN | Recommended |
| 3 | **Neon PostgreSQL EU** for database | Recommended |
| 4 | **Stripe** for payments | Recommended |
| 5 | **Fly.io** for API + workers (vs Railway/AWS) | Recommended — better CPU pricing for FFmpeg |
| 6 | **Vercel** for Next.js frontend | Recommended |
| 7 | Grace period = **14 days** after expiration before deletion | Recommended |
| 8 | Guest session TTL = **24 hours** (renewable) | Recommended |
| 9 | Default languages: **English + Greek** at launch | Recommended for CY/GR |
| 10 | Monorepo package manager: **pnpm** | Recommended |

---

**Stage 1 complete. Awaiting approval before Stage 2.**
