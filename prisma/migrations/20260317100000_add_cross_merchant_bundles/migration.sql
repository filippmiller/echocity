-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('DRAFT', 'PENDING_PARTNERS', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "totalPrice" INTEGER,
    "discountPercent" INTEGER,
    "visibility" "OfferVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "BundleStatus" NOT NULL DEFAULT 'DRAFT',
    "cityId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "offerId" TEXT,
    "placeId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "itemValue" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleRedemption" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");
CREATE INDEX "Bundle_cityId_idx" ON "Bundle"("cityId");
CREATE INDEX "Bundle_createdByUserId_idx" ON "Bundle"("createdByUserId");

CREATE INDEX "BundleItem_bundleId_idx" ON "BundleItem"("bundleId");
CREATE INDEX "BundleItem_merchantId_idx" ON "BundleItem"("merchantId");
CREATE INDEX "BundleItem_placeId_idx" ON "BundleItem"("placeId");

CREATE INDEX "BundleRedemption_bundleId_idx" ON "BundleRedemption"("bundleId");
CREATE INDEX "BundleRedemption_userId_idx" ON "BundleRedemption"("userId");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BundleRedemption" ADD CONSTRAINT "BundleRedemption_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleRedemption" ADD CONSTRAINT "BundleRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
