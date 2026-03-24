-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CITIZEN', 'BUSINESS_OWNER', 'MERCHANT_STAFF');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('CAFE', 'RESTAURANT', 'BAR', 'BEAUTY', 'NAILS', 'HAIR', 'DRYCLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ru', 'en');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('CAFE', 'BAR', 'RESTAURANT', 'NAIL_SALON', 'HAIRDRESSER', 'BARBERSHOP', 'DRY_CLEANING', 'OTHER_SERVICE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'RENEWAL', 'ONE_TIME', 'REFUND');

-- CreateEnum
CREATE TYPE "RedemptionChannel" AS ENUM ('IN_STORE', 'ONLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('PERCENT_DISCOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE', 'FIRST_VISIT', 'OFF_PEAK', 'FLASH', 'REQUEST_ONLY', 'MYSTERY_BAG');

-- CreateEnum
CREATE TYPE "OfferVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'FREE_FOR_ALL');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE', 'MYSTERY_BAG');

-- CreateEnum
CREATE TYPE "OfferApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OfferLifecycleStatus" AS ENUM ('INACTIVE', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OfferRuleType" AS ENUM ('FIRST_TIME_ONLY', 'ONCE_PER_DAY', 'ONCE_PER_WEEK', 'ONCE_PER_MONTH', 'ONCE_PER_LIFETIME', 'MIN_CHECK', 'GEO_RADIUS', 'EXCLUDED_CATEGORIES', 'ALLOWED_CATEGORIES', 'MIN_PARTY_SIZE');

-- CreateEnum
CREATE TYPE "RedemptionSessionStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('SUCCESS', 'REJECTED', 'REVERSED', 'FRAUD_SUSPECTED');

-- CreateEnum
CREATE TYPE "RedemptionEventType" AS ENUM ('QR_GENERATED', 'QR_REFRESHED', 'SCAN_STARTED', 'REDEEMED', 'REVERSED', 'LIMIT_FAILED', 'RULE_FAILED', 'GEO_FAILED', 'FRAUD_FLAGGED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CASHIER', 'MANAGER');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('REDEMPTION_FEE', 'CLICK_FEE');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('OPEN', 'COLLECTING', 'FULFILLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GroupDealStatus" AS ENUM ('OPEN', 'READY', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FraudFlagStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "FranchiseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FranchiseMemberRole" AS ENUM ('OWNER', 'MANAGER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ServicePricingUnit" AS ENUM ('FIXED', 'PER_HOUR', 'PER_ITEM', 'PER_KG', 'PER_SQ_M');

-- CreateEnum
CREATE TYPE "FavoriteEntityType" AS ENUM ('PLACE', 'OFFER');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('OFFER_NOT_HONORED', 'RUDE_STAFF', 'FALSE_ADVERTISING', 'WRONG_DISCOUNT', 'FRAUD', 'CONTENT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'REWARDED');

-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('EDITORIAL', 'ALGORITHMIC', 'USER_GENERATED');

-- CreateEnum
CREATE TYPE "StoryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('FIRST_REDEMPTION', 'REDEEM_COUNT', 'VISIT_PLACES', 'REFER_FRIENDS', 'WRITE_REVIEWS', 'STREAK_DAYS', 'SAVE_AMOUNT', 'EXPLORE_CATEGORIES');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DemandResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('DRAFT', 'PENDING_PARTNERS', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('REDEMPTION_CASHBACK', 'REFERRAL_BONUS', 'STREAK_BONUS', 'SUBSCRIPTION_PAYMENT', 'MANUAL_ADJUSTMENT', 'REVIEW_REWARD', 'CORPORATE_CREDIT');

-- CreateEnum
CREATE TYPE "CorporatePlanStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL DEFAULT 'Санкт-Петербург',
    "language" "Language" NOT NULL DEFAULT 'ru',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "streakCurrent" INTEGER NOT NULL DEFAULT 0,
    "streakLongest" INTEGER NOT NULL DEFAULT 0,
    "streakLastDate" TIMESTAMP(3),
    "freezeTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "rouletteLastSpun" TIMESTAMP(3),
    "showOnLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "homeCity" TEXT,
    "preferredLanguage" TEXT DEFAULT 'ru',
    "timezone" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "preferredRadius" INTEGER,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "favoriteCity" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessAccount" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "type" "BusinessType" NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "vk" TEXT,
    "telegram" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "yandexOrgId" TEXT,
    "yandexOrgName" TEXT,
    "yandexOrgRaw" JSONB,
    "yandexVerifiedAt" TIMESTAMP(3),
    "yandexVerificationMethod" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "placeType" "BusinessType" NOT NULL,
    "hasWorkspace" BOOLEAN NOT NULL DEFAULT false,
    "hasWifi" BOOLEAN NOT NULL DEFAULT false,
    "hasSockets" BOOLEAN NOT NULL DEFAULT false,
    "isSpecialtyCoffee" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "isKidsFriendly" BOOLEAN NOT NULL DEFAULT false,
    "openingHours" JSONB,
    "averageCheck" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nearestMetro" TEXT,
    "publicName" TEXT,
    "category" "PlaceCategory",
    "descriptionShort" TEXT,
    "phonePublic" TEXT,
    "websiteUrl" TEXT,
    "cityId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'RU',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priceLevel" INTEGER,
    "tagsJson" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "status" "FranchiseStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingEmail" TEXT,
    "billingPlan" TEXT,
    "revenueSharePercent" INTEGER,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "defaultLanguage" TEXT,
    "franchiseId" TEXT,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseMember" (
    "id" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FranchiseMemberRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceService" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "priceUnit" "ServicePricingUnit" NOT NULL DEFAULT 'FIXED',
    "durationMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "specialPrice" DECIMAL(10,2),
    "specialTitle" TEXT,
    "specialDescription" TEXT,
    "specialValidUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isAvatar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerLogin" TEXT,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" INTEGER NOT NULL,
    "yearlyPrice" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "features" JSONB NOT NULL,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "canceledAt" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'YOKASSA',
    "externalPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PaymentType" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "offerType" "OfferType" NOT NULL,
    "visibility" "OfferVisibility" NOT NULL DEFAULT 'PUBLIC',
    "benefitType" "BenefitType" NOT NULL,
    "benefitValue" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "minOrderAmount" DECIMAL(65,30),
    "maxDiscountAmount" DECIMAL(65,30),
    "approvalStatus" "OfferApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "lifecycleStatus" "OfferLifecycleStatus" NOT NULL DEFAULT 'INACTIVE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "termsText" TEXT,
    "imageUrl" TEXT,
    "rejectionReason" TEXT,
    "redemptionChannel" "RedemptionChannel" NOT NULL DEFAULT 'IN_STORE',
    "onlineUrl" TEXT,
    "promoCode" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSchedule" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "isBlackout" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OfferSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferBlackoutDate" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "OfferBlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRule" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "ruleType" "OfferRuleType" NOT NULL,
    "operator" TEXT,
    "value" JSONB NOT NULL,

    CONSTRAINT "OfferRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLimit" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "dailyLimit" INTEGER,
    "weeklyLimit" INTEGER,
    "monthlyLimit" INTEGER,
    "totalLimit" INTEGER,
    "perUserDailyLimit" INTEGER,
    "perUserWeeklyLimit" INTEGER,
    "perUserLifetimeLimit" INTEGER,

    CONSTRAINT "OfferLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "status" "RedemptionSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userLat" DOUBLE PRECISION,
    "userLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "scannedByUserId" TEXT,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'SUCCESS',
    "orderAmount" DECIMAL(65,30),
    "discountAmount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "redemptionId" TEXT,
    "eventType" "RedemptionEventType" NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantStaff" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "branchId" TEXT,
    "userId" TEXT NOT NULL,
    "staffRole" "StaffRole" NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantBillingEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "redemptionId" TEXT,
    "eventType" "BillingEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "BillingEventStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantBillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT,
    "offerId" TEXT,
    "placeName" TEXT,
    "categoryId" TEXT,
    "cityId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "DemandStatus" NOT NULL DEFAULT 'OPEN',
    "supportCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSupport" (
    "id" TEXT NOT NULL,
    "demandRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "flagType" TEXT NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "status" "FraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "FavoriteEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT,
    "offerId" TEXT,
    "redemptionId" TEXT,
    "type" "ComplaintType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "type" "CollectionType" NOT NULL DEFAULT 'EDITORIAL',
    "cityId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSavings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "savedAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserXP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserXP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferReview" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "FamilyPlan" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyPlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableConfig" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TableConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "tableId" TEXT,
    "userId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT,
    "partySize" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 90,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDeal" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "GroupDealStatus" NOT NULL DEFAULT 'OPEN',
    "minMembers" INTEGER NOT NULL DEFAULT 3,
    "bonusPercent" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDealMember" (
    "id" TEXT NOT NULL,
    "groupDealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupDealMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporatePlan" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "inn" TEXT,
    "billingEmail" TEXT NOT NULL,
    "billingPhone" TEXT,
    "contactName" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "monthlyBudget" INTEGER NOT NULL,
    "status" "CorporatePlanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateEmployee" (
    "id" TEXT NOT NULL,
    "corporatePlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateInvoice" (
    "id" TEXT NOT NULL,
    "corporatePlanId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAccount_ownerUserId_key" ON "BusinessAccount"("ownerUserId");

-- CreateIndex
CREATE INDEX "BusinessAccount_ownerUserId_idx" ON "BusinessAccount"("ownerUserId");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Business_yandexOrgId_idx" ON "Business"("yandexOrgId");

-- CreateIndex
CREATE INDEX "Place_businessAccountId_idx" ON "Place"("businessAccountId");

-- CreateIndex
CREATE INDEX "Place_businessId_idx" ON "Place"("businessId");

-- CreateIndex
CREATE INDEX "Place_cityId_idx" ON "Place"("cityId");

-- CreateIndex
CREATE INDEX "Place_placeType_idx" ON "Place"("placeType");

-- CreateIndex
CREATE INDEX "Place_isActive_idx" ON "Place"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_code_key" ON "Franchise"("code");

-- CreateIndex
CREATE INDEX "Franchise_ownerUserId_idx" ON "Franchise"("ownerUserId");

-- CreateIndex
CREATE INDEX "Franchise_code_idx" ON "Franchise"("code");

-- CreateIndex
CREATE INDEX "Franchise_status_idx" ON "Franchise"("status");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_slug_idx" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_franchiseId_idx" ON "City"("franchiseId");

-- CreateIndex
CREATE INDEX "FranchiseMember_franchiseId_idx" ON "FranchiseMember"("franchiseId");

-- CreateIndex
CREATE INDEX "FranchiseMember_userId_idx" ON "FranchiseMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseMember_franchiseId_userId_key" ON "FranchiseMember"("franchiseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_slug_idx" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_sortOrder_idx" ON "ServiceCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_slug_key" ON "ServiceType"("slug");

-- CreateIndex
CREATE INDEX "ServiceType_categoryId_idx" ON "ServiceType"("categoryId");

-- CreateIndex
CREATE INDEX "ServiceType_slug_idx" ON "ServiceType"("slug");

-- CreateIndex
CREATE INDEX "ServiceType_isActive_sortOrder_idx" ON "ServiceType"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PlaceService_placeId_idx" ON "PlaceService"("placeId");

-- CreateIndex
CREATE INDEX "PlaceService_serviceTypeId_idx" ON "PlaceService"("serviceTypeId");

-- CreateIndex
CREATE INDEX "PlaceService_isActive_idx" ON "PlaceService"("isActive");

-- CreateIndex
CREATE INDEX "PlaceService_isSpecial_idx" ON "PlaceService"("isSpecial");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceService_placeId_serviceTypeId_key" ON "PlaceService"("placeId", "serviceTypeId");

-- CreateIndex
CREATE INDEX "Review_placeId_idx" ON "Review"("placeId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_isPublished_isDeleted_idx" ON "Review"("isPublished", "isDeleted");

-- CreateIndex
CREATE INDEX "Review_placeId_isPublished_isDeleted_idx" ON "Review"("placeId", "isPublished", "isDeleted");

-- CreateIndex
CREATE INDEX "UserPhoto_userId_idx" ON "UserPhoto"("userId");

-- CreateIndex
CREATE INDEX "UserPhoto_userId_isAvatar_idx" ON "UserPhoto"("userId", "isAvatar");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE INDEX "OAuthAccount_provider_providerUserId_idx" ON "OAuthAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerUserId_key" ON "OAuthAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalPaymentId_key" ON "Payment"("externalPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Offer_merchantId_idx" ON "Offer"("merchantId");

-- CreateIndex
CREATE INDEX "Offer_branchId_idx" ON "Offer"("branchId");

-- CreateIndex
CREATE INDEX "Offer_lifecycleStatus_idx" ON "Offer"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "Offer_visibility_idx" ON "Offer"("visibility");

-- CreateIndex
CREATE INDEX "Offer_offerType_idx" ON "Offer"("offerType");

-- CreateIndex
CREATE INDEX "OfferSchedule_offerId_idx" ON "OfferSchedule"("offerId");

-- CreateIndex
CREATE INDEX "OfferBlackoutDate_offerId_idx" ON "OfferBlackoutDate"("offerId");

-- CreateIndex
CREATE INDEX "OfferRule_offerId_idx" ON "OfferRule"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferLimit_offerId_key" ON "OfferLimit"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "RedemptionSession_sessionToken_key" ON "RedemptionSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "RedemptionSession_shortCode_key" ON "RedemptionSession"("shortCode");

-- CreateIndex
CREATE INDEX "RedemptionSession_userId_idx" ON "RedemptionSession"("userId");

-- CreateIndex
CREATE INDEX "RedemptionSession_offerId_idx" ON "RedemptionSession"("offerId");

-- CreateIndex
CREATE INDEX "RedemptionSession_sessionToken_idx" ON "RedemptionSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RedemptionSession_shortCode_idx" ON "RedemptionSession"("shortCode");

-- CreateIndex
CREATE INDEX "RedemptionSession_status_expiresAt_idx" ON "RedemptionSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_sessionId_key" ON "Redemption"("sessionId");

-- CreateIndex
CREATE INDEX "Redemption_userId_idx" ON "Redemption"("userId");

-- CreateIndex
CREATE INDEX "Redemption_offerId_idx" ON "Redemption"("offerId");

-- CreateIndex
CREATE INDEX "Redemption_merchantId_idx" ON "Redemption"("merchantId");

-- CreateIndex
CREATE INDEX "Redemption_branchId_idx" ON "Redemption"("branchId");

-- CreateIndex
CREATE INDEX "Redemption_redeemedAt_idx" ON "Redemption"("redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_offerId_status_redeemedAt_idx" ON "Redemption"("offerId", "status", "redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_userId_offerId_status_idx" ON "Redemption"("userId", "offerId", "status");

-- CreateIndex
CREATE INDEX "RedemptionEvent_sessionId_idx" ON "RedemptionEvent"("sessionId");

-- CreateIndex
CREATE INDEX "RedemptionEvent_redemptionId_idx" ON "RedemptionEvent"("redemptionId");

-- CreateIndex
CREATE INDEX "RedemptionEvent_eventType_idx" ON "RedemptionEvent"("eventType");

-- CreateIndex
CREATE INDEX "MerchantStaff_userId_idx" ON "MerchantStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantStaff_merchantId_userId_key" ON "MerchantStaff"("merchantId", "userId");

-- CreateIndex
CREATE INDEX "MerchantBillingEvent_merchantId_idx" ON "MerchantBillingEvent"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantBillingEvent_status_idx" ON "MerchantBillingEvent"("status");

-- CreateIndex
CREATE INDEX "DemandRequest_placeId_idx" ON "DemandRequest"("placeId");

-- CreateIndex
CREATE INDEX "DemandRequest_cityId_idx" ON "DemandRequest"("cityId");

-- CreateIndex
CREATE INDEX "DemandRequest_status_idx" ON "DemandRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DemandSupport_demandRequestId_userId_key" ON "DemandSupport"("demandRequestId", "userId");

-- CreateIndex
CREATE INDEX "FraudFlag_entityType_entityId_idx" ON "FraudFlag"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FraudFlag_status_idx" ON "FraudFlag"("status");

-- CreateIndex
CREATE INDEX "Favorite_userId_entityType_idx" ON "Favorite"("userId", "entityType");

-- CreateIndex
CREATE INDEX "Favorite_entityId_idx" ON "Favorite"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_entityType_entityId_key" ON "Favorite"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "Complaint"("userId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_placeId_idx" ON "Complaint"("placeId");

-- CreateIndex
CREATE INDEX "Complaint_offerId_idx" ON "Complaint"("offerId");

-- CreateIndex
CREATE INDEX "Complaint_priority_status_idx" ON "Complaint"("priority", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_invitedUserId_key" ON "Referral"("invitedUserId");

-- CreateIndex
CREATE INDEX "Referral_referralCodeId_idx" ON "Referral"("referralCodeId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_isFeatured_isActive_idx" ON "Collection"("isFeatured", "isActive");

-- CreateIndex
CREATE INDEX "Collection_cityId_idx" ON "Collection"("cityId");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_entityType_entityId_key" ON "CollectionItem"("collectionId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSavings_redemptionId_key" ON "UserSavings"("redemptionId");

-- CreateIndex
CREATE INDEX "UserSavings_userId_idx" ON "UserSavings"("userId");

-- CreateIndex
CREATE INDEX "UserSavings_userId_savedAt_idx" ON "UserSavings"("userId", "savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Story_merchantId_idx" ON "Story"("merchantId");

-- CreateIndex
CREATE INDEX "Story_branchId_idx" ON "Story"("branchId");

-- CreateIndex
CREATE INDEX "Story_isActive_expiresAt_idx" ON "Story"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

-- CreateIndex
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_code_key" ON "Mission"("code");

-- CreateIndex
CREATE INDEX "Mission_isActive_idx" ON "Mission"("isActive");

-- CreateIndex
CREATE INDEX "Mission_type_idx" ON "Mission"("type");

-- CreateIndex
CREATE INDEX "UserMission_userId_status_idx" ON "UserMission"("userId", "status");

-- CreateIndex
CREATE INDEX "UserMission_missionId_idx" ON "UserMission"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_userId_missionId_key" ON "UserMission"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE INDEX "Badge_isActive_idx" ON "Badge"("isActive");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "Badge"("category");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserXP_userId_key" ON "UserXP"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferReview_redemptionId_key" ON "OfferReview"("redemptionId");

-- CreateIndex
CREATE INDEX "OfferReview_offerId_idx" ON "OfferReview"("offerId");

-- CreateIndex
CREATE INDEX "OfferReview_userId_idx" ON "OfferReview"("userId");

-- CreateIndex
CREATE INDEX "OfferReview_offerId_isPublished_idx" ON "OfferReview"("offerId", "isPublished");

-- CreateIndex
CREATE INDEX "DemandResponse_demandRequestId_idx" ON "DemandResponse"("demandRequestId");

-- CreateIndex
CREATE INDEX "DemandResponse_merchantId_idx" ON "DemandResponse"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandResponse_demandRequestId_merchantId_key" ON "DemandResponse"("demandRequestId", "merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyPlan_subscriptionId_key" ON "FamilyPlan"("subscriptionId");

-- CreateIndex
CREATE INDEX "FamilyPlan_ownerUserId_idx" ON "FamilyPlan"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyPlan_ownerUserId_key" ON "FamilyPlan"("ownerUserId");

-- CreateIndex
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyPlanId_userId_key" ON "FamilyMember"("familyPlanId", "userId");

-- CreateIndex
CREATE INDEX "TableConfig_placeId_isActive_idx" ON "TableConfig"("placeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TableConfig_placeId_tableNumber_key" ON "TableConfig"("placeId", "tableNumber");

-- CreateIndex
CREATE INDEX "Reservation_placeId_date_status_idx" ON "Reservation"("placeId", "date", "status");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");

-- CreateIndex
CREATE INDEX "Reservation_date_timeSlot_idx" ON "Reservation"("date", "timeSlot");

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");

-- CreateIndex
CREATE INDEX "Bundle_cityId_idx" ON "Bundle"("cityId");

-- CreateIndex
CREATE INDEX "Bundle_createdByUserId_idx" ON "Bundle"("createdByUserId");

-- CreateIndex
CREATE INDEX "BundleItem_bundleId_idx" ON "BundleItem"("bundleId");

-- CreateIndex
CREATE INDEX "BundleItem_merchantId_idx" ON "BundleItem"("merchantId");

-- CreateIndex
CREATE INDEX "BundleItem_placeId_idx" ON "BundleItem"("placeId");

-- CreateIndex
CREATE INDEX "BundleRedemption_bundleId_idx" ON "BundleRedemption"("bundleId");

-- CreateIndex
CREATE INDEX "BundleRedemption_userId_idx" ON "BundleRedemption"("userId");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_code_idx" ON "PhoneOtp"("phone", "code");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_idx" ON "CoinTransaction"("userId");

-- CreateIndex
CREATE INDEX "CoinTransaction_createdAt_idx" ON "CoinTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "GroupDeal_offerId_idx" ON "GroupDeal"("offerId");

-- CreateIndex
CREATE INDEX "GroupDeal_status_idx" ON "GroupDeal"("status");

-- CreateIndex
CREATE INDEX "GroupDealMember_userId_idx" ON "GroupDealMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDealMember_groupDealId_userId_key" ON "GroupDealMember"("groupDealId", "userId");

-- CreateIndex
CREATE INDEX "CorporatePlan_status_idx" ON "CorporatePlan"("status");

-- CreateIndex
CREATE INDEX "CorporateEmployee_userId_idx" ON "CorporateEmployee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateEmployee_corporatePlanId_userId_key" ON "CorporateEmployee"("corporatePlanId", "userId");

-- CreateIndex
CREATE INDEX "CorporateInvoice_corporatePlanId_idx" ON "CorporateInvoice"("corporatePlanId");

-- CreateIndex
CREATE INDEX "CorporateInvoice_status_idx" ON "CorporateInvoice"("status");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAccount" ADD CONSTRAINT "BusinessAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Franchise" ADD CONSTRAINT "Franchise_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseMember" ADD CONSTRAINT "FranchiseMember_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseMember" ADD CONSTRAINT "FranchiseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceService" ADD CONSTRAINT "PlaceService_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceService" ADD CONSTRAINT "PlaceService_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSchedule" ADD CONSTRAINT "OfferSchedule_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferBlackoutDate" ADD CONSTRAINT "OfferBlackoutDate_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRule" ADD CONSTRAINT "OfferRule_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLimit" ADD CONSTRAINT "OfferLimit_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionSession" ADD CONSTRAINT "RedemptionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionSession" ADD CONSTRAINT "RedemptionSession_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionSession" ADD CONSTRAINT "RedemptionSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RedemptionSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionEvent" ADD CONSTRAINT "RedemptionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RedemptionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionEvent" ADD CONSTRAINT "RedemptionEvent_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStaff" ADD CONSTRAINT "MerchantStaff_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStaff" ADD CONSTRAINT "MerchantStaff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStaff" ADD CONSTRAINT "MerchantStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRequest" ADD CONSTRAINT "DemandRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRequest" ADD CONSTRAINT "DemandRequest_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRequest" ADD CONSTRAINT "DemandRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRequest" ADD CONSTRAINT "DemandRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRequest" ADD CONSTRAINT "DemandRequest_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandSupport" ADD CONSTRAINT "DemandSupport_demandRequestId_fkey" FOREIGN KEY ("demandRequestId") REFERENCES "DemandRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandSupport" ADD CONSTRAINT "DemandSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavings" ADD CONSTRAINT "UserSavings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_linkOfferId_fkey" FOREIGN KEY ("linkOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserXP" ADD CONSTRAINT "UserXP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferReview" ADD CONSTRAINT "OfferReview_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_demandRequestId_fkey" FOREIGN KEY ("demandRequestId") REFERENCES "DemandRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandResponse" ADD CONSTRAINT "DemandResponse_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPlan" ADD CONSTRAINT "FamilyPlan_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPlan" ADD CONSTRAINT "FamilyPlan_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyPlanId_fkey" FOREIGN KEY ("familyPlanId") REFERENCES "FamilyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableConfig" ADD CONSTRAINT "TableConfig_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "TableConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleRedemption" ADD CONSTRAINT "BundleRedemption_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleRedemption" ADD CONSTRAINT "BundleRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDeal" ADD CONSTRAINT "GroupDeal_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDeal" ADD CONSTRAINT "GroupDeal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDealMember" ADD CONSTRAINT "GroupDealMember_groupDealId_fkey" FOREIGN KEY ("groupDealId") REFERENCES "GroupDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDealMember" ADD CONSTRAINT "GroupDealMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEmployee" ADD CONSTRAINT "CorporateEmployee_corporatePlanId_fkey" FOREIGN KEY ("corporatePlanId") REFERENCES "CorporatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEmployee" ADD CONSTRAINT "CorporateEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_corporatePlanId_fkey" FOREIGN KEY ("corporatePlanId") REFERENCES "CorporatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

