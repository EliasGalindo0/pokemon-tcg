-- Drop old event tables if present
DROP TABLE IF EXISTS "PlayerEventPrize";
DROP TABLE IF EXISTS "PlayerEvent";
DROP TYPE IF EXISTS "EventKind";

-- CreateTable
CREATE TABLE "PlayerCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tcgId" TEXT,
    "name" TEXT NOT NULL,
    "setName" TEXT,
    "cardNumber" TEXT,
    "imageUrl" TEXT,
    "rarity" "Rarity" NOT NULL DEFAULT 'PROMO',
    "language" "Language" NOT NULL DEFAULT 'PT_BR',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "eventName" TEXT,
    "eventDate" TIMESTAMP(3),
    "placement" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerCard_userId_eventDate_idx" ON "PlayerCard"("userId", "eventDate");

-- CreateIndex
CREATE INDEX "PlayerCard_userId_name_idx" ON "PlayerCard"("userId", "name");

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
