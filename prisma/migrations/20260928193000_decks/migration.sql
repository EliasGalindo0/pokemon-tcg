-- CreateEnum
CREATE TYPE "DeckFormat" AS ENUM ('STANDARD', 'EXPANDED', 'UNLIMITED', 'OTHER');

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "DeckFormat" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckEntry" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deck_name_idx" ON "Deck"("name");

-- CreateIndex
CREATE INDEX "DeckEntry_cardId_idx" ON "DeckEntry"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckEntry_deckId_cardId_key" ON "DeckEntry"("deckId", "cardId");

-- AddForeignKey
ALTER TABLE "DeckEntry" ADD CONSTRAINT "DeckEntry_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckEntry" ADD CONSTRAINT "DeckEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
