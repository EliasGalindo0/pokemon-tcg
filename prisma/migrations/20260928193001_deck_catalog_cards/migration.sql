-- Cartas de deck que não estão na coleção guardam um recorte do catálogo.
ALTER TABLE "DeckEntry" ALTER COLUMN "cardId" DROP NOT NULL;

ALTER TABLE "DeckEntry" ADD COLUMN "tcgId" TEXT;
ALTER TABLE "DeckEntry" ADD COLUMN "name" TEXT;
ALTER TABLE "DeckEntry" ADD COLUMN "setName" TEXT;
ALTER TABLE "DeckEntry" ADD COLUMN "cardNumber" TEXT;
ALTER TABLE "DeckEntry" ADD COLUMN "imageUrl" TEXT;

CREATE UNIQUE INDEX "DeckEntry_deckId_tcgId_key" ON "DeckEntry"("deckId", "tcgId");
