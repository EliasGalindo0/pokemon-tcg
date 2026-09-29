-- AlterTable
ALTER TABLE "User" ADD COLUMN "collectionPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_collectionPublic_active_idx" ON "User"("collectionPublic", "active");
