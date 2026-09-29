-- CreateTable
CREATE TABLE "TradeSet" (
    "id" TEXT NOT NULL,
    "tcgSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "language" "Language" NOT NULL DEFAULT 'PT_BR',
    "official" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEntry" (
    "id" TEXT NOT NULL,
    "tradeSetId" TEXT NOT NULL,
    "tcgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "cardNumber" TEXT,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeSet_name_idx" ON "TradeSet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TradeSet_tcgSetId_language_key" ON "TradeSet"("tcgSetId", "language");

-- CreateIndex
CREATE INDEX "TradeEntry_tradeSetId_idx" ON "TradeEntry"("tradeSetId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeEntry_tradeSetId_tcgId_key" ON "TradeEntry"("tradeSetId", "tcgId");

-- AddForeignKey
ALTER TABLE "TradeEntry" ADD CONSTRAINT "TradeEntry_tradeSetId_fkey" FOREIGN KEY ("tradeSetId") REFERENCES "TradeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
