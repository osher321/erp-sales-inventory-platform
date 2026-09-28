-- CreateEnum
CREATE TYPE "IntegrationEntity" AS ENUM ('CUSTOMER', 'PRODUCT', 'INVENTORY', 'ORDER');

-- CreateEnum
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "IntegrationSync" (
    "id" TEXT NOT NULL,
    "entity" "IntegrationEntity" NOT NULL,
    "status" "IntegrationSyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "recordsProcessed" INTEGER NOT NULL,
    "recordsSucceeded" INTEGER NOT NULL,
    "recordsFailed" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "payloadSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationSync_createdAt_idx" ON "IntegrationSync"("createdAt");

-- CreateIndex
CREATE INDEX "IntegrationSync_entity_idx" ON "IntegrationSync"("entity");
