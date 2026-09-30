-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('CHAMPIONSHIP', 'LEAGUE', 'CUP', 'LOCAL', 'OTHER');

-- CreateTable
CREATE TABLE "PlayerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL DEFAULT 'LEAGUE',
    "location" TEXT,
    "heldAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEventPrize" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tcgId" TEXT,
    "name" TEXT NOT NULL,
    "setName" TEXT,
    "cardNumber" TEXT,
    "imageUrl" TEXT,
    "rarity" "Rarity" NOT NULL DEFAULT 'PROMO',
    "language" "Language" NOT NULL DEFAULT 'PT_BR',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "placement" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerEventPrize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerEvent_userId_heldAt_idx" ON "PlayerEvent"("userId", "heldAt");

-- CreateIndex
CREATE INDEX "PlayerEvent_userId_name_idx" ON "PlayerEvent"("userId", "name");

-- CreateIndex
CREATE INDEX "PlayerEventPrize_eventId_idx" ON "PlayerEventPrize"("eventId");

-- AddForeignKey
ALTER TABLE "PlayerEvent" ADD CONSTRAINT "PlayerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEventPrize" ADD CONSTRAINT "PlayerEventPrize_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PlayerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
