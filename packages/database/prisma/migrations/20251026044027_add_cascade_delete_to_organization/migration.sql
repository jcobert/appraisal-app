-- DropForeignKey
ALTER TABLE "public"."OrgInvitation" DROP CONSTRAINT "OrgInvitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrgMember" DROP CONSTRAINT "OrgMember_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInvitation" ADD CONSTRAINT "OrgInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
