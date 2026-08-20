import { dbClient } from '../config/redis'
import { engTodb } from '../Types/EngineTypes'
import type { Fill, OrderRecord } from '../Types/OrderFillsType';
import { type balance } from '../Types/types'

type Result = {
  userId: number;
  order: OrderRecord;
  otherOrders?: OrderRecord[] | null;
  fills: Fill[] | null;
  incomingBalance: balance | undefined;
  makerBalances?: Record<number, any> | null;
  createOrCancel: string
}

export default async function EngTodb(result: Result) {
  console.log("sending to db worker")

  console.log(result.incomingBalance)
  const incomingBalanceStr = result.incomingBalance ? JSON.stringify([...result.incomingBalance.entries()]) : null
  console.log(incomingBalanceStr)


  const makerBalancesStr = result.makerBalances ? JSON.stringify(
    Object.fromEntries(
      Object.entries(result.makerBalances).map(([userId, makerBalance]) => [
        userId, [...makerBalance.entries()],
      ]),
    ),
  ) : null
  console.log(makerBalancesStr)

  const data = JSON.stringify({ order: result.order, otherOrder: result.otherOrders, fills: result.fills, incomingBalance: incomingBalanceStr, makerBalances: makerBalancesStr, userId: result.userId, createOrCancel: result.createOrCancel })
  const ToDBWorker = await dbClient.xAdd(engTodb, '*', { data })
  console.log(ToDBWorker)
}