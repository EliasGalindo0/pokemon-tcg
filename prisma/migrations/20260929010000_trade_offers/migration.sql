-- CreateEnum
CREATE TYPE "TradeOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TradeOffer" (
    "id" TEXT NOT NULL,
    "status" "TradeOfferStatus" NOT NULL DEFAULT 'PENDING',
    "wantedTradeSetId" TEXT NOT NULL,
    "wantedTcgId" TEXT NOT NULL,
    "wantedName" TEXT NOT NULL,
    "wantedNumber" TEXT,
    "wantedImageUrl" TEXT,
    "offeredTcgId" TEXT NOT NULL,
    "offeredName" TEXT NOT NULL,
    "offeredSetName" TEXT NOT NULL,
    "offeredSetCode" TEXT,
    "offeredNumber" TEXT,
    "offeredImageUrl" TEXT,
    "offeredLanguage" "Language" NOT NULL DEFAULT 'PT_BR',
    "offeredRarity" "Rarity" NOT NULL DEFAULT 'COMMON',
    "visitorName" TEXT,
    "visitorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TradeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeOffer_status_createdAt_idx" ON "TradeOffer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TradeOffer_wantedTradeSetId_idx" ON "TradeOffer"("wantedTradeSetId");

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_wantedTradeSetId_fkey" FOREIGN KEY ("wantedTradeSetId") REFERENCES "TradeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
