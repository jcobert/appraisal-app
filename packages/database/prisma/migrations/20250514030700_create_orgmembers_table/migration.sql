/*
  Warnings:

  - You are about to drop the column `userId` on the `Appraiser` table. All the data in the column will be lost.
  - You are about to drop the column `userRole` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_OrganizationMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'manager', 'appraiser');

-- DropForeignKey
ALTER TABLE "Appraiser" DROP CONSTRAINT "Appraiser_userId_fkey";

-- DropForeignKey
ALTER TABLE "_OrganizationMembers" DROP CONSTRAINT "_OrganizationMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrganizationMembers" DROP CONSTRAINT "_OrganizationMembers_B_fkey";

-- DropIndex
DROP INDEX "Appraiser_userId_key";

-- AlterTable
ALTER TABLE "Appraiser" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userRole";

-- DropTable
DROP TABLE "_OrganizationMembers";

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "roles" "MemberRole"[],
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
