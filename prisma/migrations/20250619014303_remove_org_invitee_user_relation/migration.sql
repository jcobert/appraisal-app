/*
  Warnings:

  - You are about to drop the column `inviteeUserId` on the `OrgInvitation` table. All the data in the column will be lost.
  - Added the required column `inviteeEmail` to the `OrgInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrgInvitation" DROP CONSTRAINT "OrgInvitation_inviteeUserId_fkey";

-- AlterTable
ALTER TABLE "OrgInvitation" DROP COLUMN "inviteeUserId",
ADD COLUMN     "inviteeEmail" TEXT NOT NULL,
ADD COLUMN     "inviteeFirstName" TEXT,
ADD COLUMN     "inviteeLastName" TEXT;
