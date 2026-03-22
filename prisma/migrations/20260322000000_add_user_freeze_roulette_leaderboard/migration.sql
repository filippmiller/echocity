-- Add freeze token tracking, roulette rate limiting, and leaderboard privacy fields
ALTER TABLE "User" ADD COLUMN "freezeTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "rouletteLastSpun" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "showOnLeaderboard" BOOLEAN NOT NULL DEFAULT true;
