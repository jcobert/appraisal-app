/*
  Warnings:

  - You are about to drop the column `poc` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "poc",
ADD COLUMN     "pocEmail" TEXT,
ADD COLUMN     "pocFirstName" TEXT,
ADD COLUMN     "pocLastName" TEXT,
ADD COLUMN     "pocPhone" TEXT;
