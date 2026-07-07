-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_userId_offerId_channel_type_key" ON "ReminderLog"("userId", "offerId", "channel", "type");

-- CreateIndex
CREATE INDEX "ReminderLog_userId_sentAt_idx" ON "ReminderLog"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "ReminderLog_offerId_idx" ON "ReminderLog"("offerId");

-- CreateIndex
CREATE INDEX "ReminderLog_sentAt_idx" ON "ReminderLog"("sentAt");

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_slug_key" ON "District"("cityId", "slug");

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddDistrictToPlace
ALTER TABLE "Place" ADD COLUMN "districtId" TEXT;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Place_districtId_idx" ON "Place"("districtId");

-- AddDistrictToUserProfile
ALTER TABLE "UserProfile" ADD COLUMN "districtSlug" TEXT;
