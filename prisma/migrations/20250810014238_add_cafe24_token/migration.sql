/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `rewardRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCountries` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `bankBook` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessLicense` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `commerceCertificate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `idCard` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdvanced` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `socialLinks` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the `Click` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Commission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cafe24Id]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `InfluencerProduct` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cafe24Id` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mallId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_promotionLinkId_fkey";

-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_vendorId_fkey";

-- AlterTable
ALTER TABLE "InfluencerProduct" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "rewardRate",
DROP COLUMN "shippingCountries",
DROP COLUMN "vendorId",
ADD COLUMN     "cafe24Id" INTEGER NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "mallId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bankBook",
DROP COLUMN "businessLicense",
DROP COLUMN "commerceCertificate",
DROP COLUMN "idCard",
DROP COLUMN "isAdvanced",
DROP COLUMN "socialLinks";

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "processedAt",
DROP COLUMN "requestedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Click";

-- DropTable
DROP TABLE "Commission";

-- CreateTable
CREATE TABLE "Cafe24Token" (
    "id" SERIAL NOT NULL,
    "mallId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cafe24Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cafe24Token_mallId_key" ON "Cafe24Token"("mallId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_cafe24Id_key" ON "Product"("cafe24Id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
