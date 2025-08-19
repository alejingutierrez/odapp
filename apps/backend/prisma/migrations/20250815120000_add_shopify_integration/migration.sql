-- Modify existing SyncStatus enum to add new values
ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'SYNCED';

-- SyncDirection enum already exists, no need to create it

-- CreateEnum
CREATE TYPE "ConflictResolutionAction" AS ENUM ('merge', 'overwrite', 'skip');

-- Add missing Shopify-related columns to existing tables (only if they don't exist)
-- Most shopify columns already exist from the initial migration
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shopifyUpdatedAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "shopifyInventoryItemId" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shopifyCreatedAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shopifyUpdatedAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shopifyCreatedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

-- Create SyncLog table
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "successful" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- Create WebhookLog table
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- Create ShopifyConfig table
CREATE TABLE "ShopifyConfig" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "apiVersion" TEXT NOT NULL DEFAULT '2023-10',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimitSettings" JSONB NOT NULL DEFAULT '{}',
    "syncSettings" JSONB NOT NULL DEFAULT '{}',
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyConfig_pkey" PRIMARY KEY ("id")
);

-- Create ConflictLog table
CREATE TABLE "ConflictLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "conflictFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "localData" JSONB NOT NULL,
    "shopifyData" JSONB NOT NULL,
    "resolution" "ConflictResolutionAction",
    "resolvedData" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictLog_pkey" PRIMARY KEY ("id")
);

-- Create SyncSchedule table
CREATE TABLE "SyncSchedule" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "options" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncSchedule_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance (only new ones, shopifyId indexes already exist)
CREATE INDEX IF NOT EXISTS "products_syncStatus_idx" ON "products"("syncStatus");
CREATE INDEX IF NOT EXISTS "products_lastSyncAt_idx" ON "products"("lastSyncAt");

CREATE INDEX IF NOT EXISTS "product_variants_shopifyInventoryItemId_idx" ON "product_variants"("shopifyInventoryItemId");
CREATE INDEX IF NOT EXISTS "product_variants_syncStatus_idx" ON "product_variants"("syncStatus");

CREATE INDEX IF NOT EXISTS "customers_syncStatus_idx" ON "customers"("syncStatus");

CREATE INDEX IF NOT EXISTS "orders_syncStatus_idx" ON "orders"("syncStatus");

CREATE INDEX IF NOT EXISTS "inventory_items_syncStatus_idx" ON "inventory_items"("syncStatus");

CREATE INDEX "SyncLog_entityType_idx" ON "SyncLog"("entityType");
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

CREATE INDEX "WebhookLog_topic_idx" ON "WebhookLog"("topic");
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");
CREATE INDEX "WebhookLog_processedAt_idx" ON "WebhookLog"("processedAt");

CREATE INDEX "ConflictLog_entityType_entityId_idx" ON "ConflictLog"("entityType", "entityId");
CREATE INDEX "ConflictLog_resolution_idx" ON "ConflictLog"("resolution");
CREATE INDEX "ConflictLog_createdAt_idx" ON "ConflictLog"("createdAt");

CREATE INDEX "SyncSchedule_entityType_idx" ON "SyncSchedule"("entityType");
CREATE INDEX "SyncSchedule_isActive_idx" ON "SyncSchedule"("isActive");
CREATE INDEX "SyncSchedule_nextRun_idx" ON "SyncSchedule"("nextRun");

-- Add unique constraints (these already exist from initial migration, so skip them)
CREATE UNIQUE INDEX "ShopifyConfig_shopDomain_key" ON "ShopifyConfig"("shopDomain");

-- Add foreign key constraints where applicable
-- Note: These would need to be adjusted based on your actual schema structure