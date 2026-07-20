-- Phase 3 scalability hardening — composite and time-based indexes

-- CreateIndex
CREATE INDEX "guest_sessions_event_id_created_at_idx" ON "guest_sessions"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "upload_batches_event_id_created_at_idx" ON "upload_batches"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "upload_batches_created_at_idx" ON "upload_batches"("created_at");

-- CreateIndex
CREATE INDEX "media_assets_event_id_status_idx" ON "media_assets"("event_id", "status");

-- CreateIndex
CREATE INDEX "media_assets_event_id_created_at_idx" ON "media_assets"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_guest_session_id_created_at_idx" ON "media_assets"("guest_session_id", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");
