-- AlterTable
ALTER TABLE "Set" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: sets of users who had collectionPublic=true become public
UPDATE "Set" AS s
SET "isPublic" = true
FROM "User" AS u
WHERE s."userId" = u."id" AND u."collectionPublic" = true;

-- DropIndex
DROP INDEX IF EXISTS "User_collectionPublic_active_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "collectionPublic";

-- CreateIndex
CREATE INDEX "Set_isPublic_userId_idx" ON "Set"("isPublic", "userId");
