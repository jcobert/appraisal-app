/*
  Warnings:

  - Added the required column `email` to the `Appraiser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Appraiser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appraiser" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Borrower" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;
