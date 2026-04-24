-- Sprint B — Financial integrity: idempotence cache, append-only ledger,
-- admin audit log, cron-run observability.
--
-- Dependencies: none (all new tables; no backfill).
-- Rollback: DROP TABLE "Idempotency", "FinancialEvent", "AuditLog", "CronRun";
--          DROP TYPE "FinancialEventType";

-- CreateEnum
CREATE TYPE "FinancialEventType" AS ENUM (
    'PAYMENT_INTENT_CREATED',
    'PAYMENT_SUCCEEDED',
    'PAYMENT_CANCELED',
    'PAYMENT_REFUNDED',
    'PAYMENT_FAILED',
    'SUBSCRIPTION_STARTED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_CANCELED',
    'SUBSCRIPTION_EXPIRED',
    'MANUAL_ADJUSTMENT'
);

-- CreateTable
CREATE TABLE "Idempotency" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Idempotency_scope_key_key" ON "Idempotency"("scope", "key");
CREATE INDEX "Idempotency_expiresAt_idx" ON "Idempotency"("expiresAt");
CREATE INDEX "Idempotency_status_createdAt_idx" ON "Idempotency"("status", "createdAt");

-- CreateTable
CREATE TABLE "FinancialEvent" (
    "id" TEXT NOT NULL,
    "eventType" "FinancialEventType" NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "subscriptionId" TEXT,
    "amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinancialEvent_userId_createdAt_idx" ON "FinancialEvent"("userId", "createdAt");
CREATE INDEX "FinancialEvent_paymentId_idx" ON "FinancialEvent"("paymentId");
CREATE INDEX "FinancialEvent_subscriptionId_idx" ON "FinancialEvent"("subscriptionId");
CREATE INDEX "FinancialEvent_eventType_createdAt_idx" ON "FinancialEvent"("eventType", "createdAt");

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateTable
CREATE TABLE "CronRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN,
    "error" TEXT,
    "metadata" JSONB,
    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronRun_jobName_startedAt_idx" ON "CronRun"("jobName", "startedAt");
CREATE INDEX "CronRun_startedAt_idx" ON "CronRun"("startedAt");
