-- AlterTable
ALTER TABLE "OrgMember" ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- Data migration: Set isOwner = true for existing members with 'owner' role
-- Note: This migration was created when 'owner' existed in MemberRole enum
-- If running on a fresh database after 'owner' was removed, this query will be skipped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'owner' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberRole')
  ) THEN
    UPDATE "OrgMember" SET "isOwner" = true WHERE 'owner' = ANY(roles);
  END IF;
END $$;
