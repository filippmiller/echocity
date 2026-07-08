-- Production drift repair: Prisma Client expects this nullable JSONB column.
-- Use IF NOT EXISTS because some environments already have it from the baseline.
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
