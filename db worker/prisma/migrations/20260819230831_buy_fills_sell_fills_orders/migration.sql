/*
  Warnings:

  - You are about to drop the column `orderId` on the `Fills` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[buyOrderId,sellOrderId]` on the table `Fills` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Fills" DROP CONSTRAINT "Fills_orderId_fkey";

-- AlterTable
ALTER TABLE "Fills" DROP COLUMN "orderId";

-- CreateIndex
CREATE UNIQUE INDEX "Fills_buyOrderId_sellOrderId_key" ON "Fills"("buyOrderId", "sellOrderId");

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "Orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "Orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
