-- Magic link email-approve + waiting-screen poll flow
ALTER TABLE "magic_link_tokens" ADD COLUMN "poll_token_hash" TEXT;
ALTER TABLE "magic_link_tokens" ADD COLUMN "approved_at" TIMESTAMP(3);

-- Backfill poll_token_hash for any existing rows (unused legacy tokens)
UPDATE "magic_link_tokens"
SET "poll_token_hash" = md5("id"::text || clock_timestamp()::text || random()::text)
WHERE "poll_token_hash" IS NULL;

ALTER TABLE "magic_link_tokens" ALTER COLUMN "poll_token_hash" SET NOT NULL;

CREATE UNIQUE INDEX "magic_link_tokens_poll_token_hash_key" ON "magic_link_tokens"("poll_token_hash");
