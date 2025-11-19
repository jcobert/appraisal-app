-- Data migration: Remove 'owner' from all roles arrays since we now use isOwner field
UPDATE "OrgMember" SET roles = array_remove(roles, 'owner'::"MemberRole");
UPDATE "OrgInvitation" SET roles = array_remove(roles, 'owner'::"MemberRole");

-- AlterEnum: Remove 'owner' value from MemberRole enum
ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";
CREATE TYPE "MemberRole" AS ENUM ('manager', 'appraiser');
ALTER TABLE "OrgMember" ALTER COLUMN roles TYPE "MemberRole"[] USING roles::"text"[]::"MemberRole"[];
ALTER TABLE "OrgInvitation" ALTER COLUMN roles TYPE "MemberRole"[] USING roles::"text"[]::"MemberRole"[];
DROP TYPE "MemberRole_old";
