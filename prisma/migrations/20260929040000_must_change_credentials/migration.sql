-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustChangeCredentials" BOOLEAN NOT NULL DEFAULT false;

-- Force bootstrap admin to pick a non-default username/password on next login
UPDATE "User"
SET "mustChangeCredentials" = true
WHERE "id" = 'owner_bootstrap_admin' AND "username" = 'admin';
