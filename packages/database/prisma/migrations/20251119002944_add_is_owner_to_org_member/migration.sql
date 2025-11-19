-- AlterTable
ALTER TABLE "OrgMember" ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- Data migration: Set isOwner = true for existing members with 'owner' role
UPDATE "OrgMember" SET "isOwner" = true WHERE 'owner' = ANY(roles);
