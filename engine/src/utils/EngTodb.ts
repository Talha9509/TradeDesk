import { dbClient } from '../config/redis'
import { engTodb } from '../Types/EngineTypes'
import type { Fill, OrderRecord } from '../Types/OrderFillsType';
import { type balance } from '../Types/types'

type Result = {
  userId: number;
  order: OrderRecord;
  otherOrders?: OrderRecord[] | null;
  fills: Fill[] | null;
  buyerBalance: balance | undefined;
  sellerBalance?: balance | null;
  createOrCancel: string
}

export default async function EngTodb(result: Result) {
  console.log("sending to db worker")

  console.log(result.buyerBalance)
  const buyerBalanceStr = result.buyerBalance ? JSON.stringify([...result.buyerBalance.entries()]) : null
  console.log(buyerBalanceStr)


  const sellerBalanceStr = result.sellerBalance ? JSON.stringify([...result.sellerBalance.entries()]) : null
  console.log(sellerBalanceStr)

  const data = JSON.stringify({ order: result.order, otherOrder: result.otherOrders, fills: result.fills, buyerBalance: buyerBalanceStr, sellerBalance: sellerBalanceStr, userId: result.userId, createOrCancel: result.createOrCancel })
  const ToDBWorker = await dbClient.xAdd(engTodb, '*', { data })
  console.log(ToDBWorker)
}