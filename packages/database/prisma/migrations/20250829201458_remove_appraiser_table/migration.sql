/*
  Warnings:

  - You are about to drop the `Appraiser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_appraiserId_fkey";

-- DropTable
DROP TABLE "Appraiser";

-- DropEnum
DROP TYPE "UserRole";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appraiserId_fkey" FOREIGN KEY ("appraiserId") REFERENCES "OrgMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
