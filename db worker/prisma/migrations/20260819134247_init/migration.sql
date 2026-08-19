-- CreateEnum
CREATE TYPE "Asset" AS ENUM ('BTC', 'SOL', 'ETH');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('limit', 'market');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Open', 'Filled', 'Cancelled', 'Partially_filled');

-- CreateTable
CREATE TABLE "Balances" (
    "userId" INTEGER NOT NULL,
    "SOL_avail" INTEGER NOT NULL,
    "SOL_lock" INTEGER NOT NULL,
    "ETH_avail" INTEGER NOT NULL,
    "ETH_lock" INTEGER NOT NULL,
    "USD_avail" INTEGER NOT NULL,
    "USD_lock" INTEGER NOT NULL,
    "BTC_avail" INTEGER NOT NULL,
    "BTC_lock" INTEGER NOT NULL,

    CONSTRAINT "Balances_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Orders" (
    "orderId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "market" "Asset" NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "Type" NOT NULL,
    "side" "Side" NOT NULL,
    "filledQty" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "Fills" (
    "fillId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "side" "Side" NOT NULL,
    "userId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "asset" "Asset" NOT NULL,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fills_pkey" PRIMARY KEY ("fillId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Balances_userId_key" ON "Balances"("userId");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Balances"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
