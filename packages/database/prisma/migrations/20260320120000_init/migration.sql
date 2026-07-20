-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COUPLE', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "PrivacyMode" AS ENUM ('OWN_UPLOADS_ONLY', 'ALL_GUESTS');

-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('PHOTO', 'VIDEO', 'AI_OUTPUT');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACTIVE', 'FAILED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "MediaVariantType" AS ENUM ('THUMB', 'WEB', 'HLS_360', 'HLS_720', 'HLS_1080', 'POSTER');

-- CreateEnum
CREATE TYPE "UploadBatchStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COUPLE',
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "qr_token" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "bride_name" TEXT,
    "groom_name" TEXT,
    "title" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "cover_image_media_id" UUID,
    "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "privacy_mode" "PrivacyMode" NOT NULL DEFAULT 'OWN_UPLOADS_ONLY',
    "show_guest_names_publicly" BOOLEAN NOT NULL DEFAULT true,
    "storage_used_bytes" BIGINT NOT NULL DEFAULT 0,
    "storage_limit_bytes" BIGINT NOT NULL DEFAULT 21474836480,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "session_token_hash" TEXT NOT NULL,
    "ip_hash" TEXT,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "guest_session_id" UUID NOT NULL,
    "upload_session_id" TEXT NOT NULL,
    "status" "UploadBatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "guest_session_id" UUID,
    "upload_batch_id" UUID,
    "type" "MediaAssetType" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
    "original_key" TEXT NOT NULL,
    "original_size_bytes" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_variants" (
    "id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "variant" "MediaVariantType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_token_hash_key" ON "magic_link_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "magic_link_tokens_user_id_idx" ON "magic_link_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_qr_token_key" ON "events"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "events_cover_image_media_id_key" ON "events"("cover_image_media_id");

-- CreateIndex
CREATE INDEX "events_owner_user_id_idx" ON "events"("owner_user_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_deleted_at_idx" ON "events"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_session_token_hash_key" ON "guest_sessions"("session_token_hash");

-- CreateIndex
CREATE INDEX "guest_sessions_event_id_idx" ON "guest_sessions"("event_id");

-- CreateIndex
CREATE INDEX "guest_sessions_deleted_at_idx" ON "guest_sessions"("deleted_at");

-- CreateIndex
CREATE INDEX "upload_batches_event_id_idx" ON "upload_batches"("event_id");

-- CreateIndex
CREATE INDEX "upload_batches_guest_session_id_idx" ON "upload_batches"("guest_session_id");

-- CreateIndex
CREATE INDEX "upload_batches_upload_session_id_idx" ON "upload_batches"("upload_session_id");

-- CreateIndex
CREATE INDEX "upload_batches_deleted_at_idx" ON "upload_batches"("deleted_at");

-- CreateIndex
CREATE INDEX "media_assets_event_id_idx" ON "media_assets"("event_id");

-- CreateIndex
CREATE INDEX "media_assets_guest_session_id_idx" ON "media_assets"("guest_session_id");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");

-- CreateIndex
CREATE INDEX "media_variants_media_asset_id_idx" ON "media_variants"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_variants_media_asset_id_variant_key" ON "media_variants"("media_asset_id", "variant");

-- AddForeignKey
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_media_id_fkey" FOREIGN KEY ("cover_image_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_upload_batch_id_fkey" FOREIGN KEY ("upload_batch_id") REFERENCES "upload_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

