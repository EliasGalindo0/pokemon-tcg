-- CreateTable
CREATE TABLE "DeckRevision" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeckRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckRevision_deckId_createdAt_idx" ON "DeckRevision"("deckId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeckRevision" ADD CONSTRAINT "DeckRevision_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
