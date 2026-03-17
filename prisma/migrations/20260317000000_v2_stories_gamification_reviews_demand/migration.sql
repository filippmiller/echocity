-- V2 Feature Migration: Stories, Gamification, Offer Reviews, Demand Responses

-- Enums
CREATE TYPE "StoryMediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "MissionType" AS ENUM ('FIRST_REDEMPTION', 'REDEEM_COUNT', 'VISIT_PLACES', 'REFER_FRIENDS', 'WRITE_REVIEWS', 'STREAK_DAYS', 'SAVE_AMOUNT', 'EXPLORE_CATEGORIES');
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');
CREATE TYPE "DemandResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- Stories
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "StoryMediaType" NOT NULL DEFAULT 'IMAGE',
    "caption" TEXT,
    "linkOfferId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- Gamification
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL DEFAULT '🎯',
    "type" "MissionType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL DEFAULT '🏅',
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserXP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserXP_pkey" PRIMARY KEY ("id")
);

-- Offer Reviews
CREATE TABLE "OfferReview" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfferReview_pkey" PRIMARY KEY ("id")
);

-- Demand Responses
CREATE TABLE "DemandResponse" (
    "id" TEXT NOT NULL,
    "demandRequestId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "offerId" TEXT,
    "message" TEXT,
    "status" "DemandResponseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemandResponse_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");
CREATE UNIQUE INDEX "Mission_code_key" ON "Mission"("code");
CREATE UNIQUE INDEX "UserMission_userId_missionId_key" ON "UserMission"("userId", "missionId");
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE UNIQUE INDEX "UserXP_userId_key" ON "UserXP"("userId");
CREATE UNIQUE INDEX "OfferReview_redemptionId_key" ON "OfferReview"("redemptionId");
CREATE UNIQUE INDEX "DemandResponse_demandRequestId_merchantId_key" ON "DemandResponse"("demandRequestId", "merchantId");

-- Indexes
CREATE INDEX "Story_merchantId_idx" ON "Story"("merchantId");
CREATE INDEX "Story_branchId_idx" ON "Story"("branchId");
CREATE INDEX "Story_isActive_expiresAt_idx" ON "Story"("isActive", "expiresAt");
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");
CREATE INDEX "Mission_isActive_idx" ON "Mission"("isActive");
CREATE INDEX "Mission_type_idx" ON "Mission"("type");
CREATE INDEX "UserMission_userId_status_idx" ON "UserMission"("userId", "status");
CREATE INDEX "UserMission_missionId_idx" ON "UserMission"("missionId");
CREATE INDEX "Badge_isActive_idx" ON "Badge"("isActive");
CREATE INDEX "Badge_category_idx" ON "Badge"("category");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX "OfferReview_offerId_idx" ON "OfferReview"("offerId");
CREATE INDEX "OfferReview_userId_idx" ON "OfferReview"("userId");
CREATE INDEX "OfferReview_offerId_isPublished_idx" ON "OfferReview"("offerId", "isPublished");
CREATE INDEX "DemandResponse_demandRequestId_idx" ON "DemandResponse"("demandRequestId");
CREATE INDEX "DemandResponse_merchantId_idx" ON "DemandResponse"("merchantId");

-- Foreign keys
ALTER TABLE "Story" ADD CONSTRAINT "Story_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_linkOfferId_fkey" FOREIGN KEY ("linkOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_pkey_check" CHECK (length("code") > 0);
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserXP" ADD CONSTRAINT "UserXP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_demandRequestId_fkey" FOREIGN KEY ("demandRequestId") REFERENCES "DemandRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
