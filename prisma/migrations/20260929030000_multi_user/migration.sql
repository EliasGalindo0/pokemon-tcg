-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_active_idx" ON "User"("active");

-- Bootstrap owner for existing data (password set on app boot from ADMIN_PASSWORD)
INSERT INTO "User" ("id", "username", "displayName", "passwordHash", "role", "active", "createdAt", "updatedAt")
VALUES ('owner_bootstrap_admin', 'admin', 'Administrador', 'bootstrap', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Set.userId
ALTER TABLE "Set" ADD COLUMN "userId" TEXT;
UPDATE "Set" SET "userId" = 'owner_bootstrap_admin';
ALTER TABLE "Set" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "Set_name_key";
CREATE UNIQUE INDEX "Set_userId_name_key" ON "Set"("userId", "name");
CREATE INDEX "Set_userId_idx" ON "Set"("userId");
ALTER TABLE "Set" ADD CONSTRAINT "Set_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Card.userId
ALTER TABLE "Card" ADD COLUMN "userId" TEXT;
UPDATE "Card" SET "userId" = 'owner_bootstrap_admin';
ALTER TABLE "Card" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Card_userId_idx" ON "Card"("userId");
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deck.userId
ALTER TABLE "Deck" ADD COLUMN "userId" TEXT;
UPDATE "Deck" SET "userId" = 'owner_bootstrap_admin';
ALTER TABLE "Deck" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TradeSet.userId
ALTER TABLE "TradeSet" ADD COLUMN "userId" TEXT;
UPDATE "TradeSet" SET "userId" = 'owner_bootstrap_admin';
ALTER TABLE "TradeSet" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "TradeSet_tcgSetId_language_key";
CREATE UNIQUE INDEX "TradeSet_userId_tcgSetId_language_key" ON "TradeSet"("userId", "tcgSetId", "language");
CREATE INDEX "TradeSet_userId_idx" ON "TradeSet"("userId");
ALTER TABLE "TradeSet" ADD CONSTRAINT "TradeSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TradeOffer.userId
ALTER TABLE "TradeOffer" ADD COLUMN "userId" TEXT;
UPDATE "TradeOffer" SET "userId" = 'owner_bootstrap_admin';
ALTER TABLE "TradeOffer" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "TradeOffer_status_createdAt_idx";
CREATE INDEX "TradeOffer_userId_status_createdAt_idx" ON "TradeOffer"("userId", "status", "createdAt");
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
