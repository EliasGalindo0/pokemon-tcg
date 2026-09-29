-- AlterTable
ALTER TABLE "Deck" ADD COLUMN "coverEntryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deck_coverEntryId_key" ON "Deck"("coverEntryId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_coverEntryId_fkey" FOREIGN KEY ("coverEntryId") REFERENCES "DeckEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
