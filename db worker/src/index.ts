import { dbclient } from "./config/redis"
import type { response } from "./Types/types"
import { prismaClient } from './config/db'

console.log("started")
const engTodb = 'engine_to_db'
let lastId = '$'
while (1) {
  const response = await dbclient.xRead({ key: engTodb, id: lastId }, { COUNT: 5, BLOCK: 100 })
  const stream = response?.[0]
  if (!response || response.length == 0 || response == undefined || !stream) continue

  console.log(response)
  for (const message of stream.messages) {
    lastId = message.id;
    const parsedMessage: response = JSON.parse(message.message.data)
    console.log(parsedMessage)

    const order = parsedMessage.order
    const otherOrders = parsedMessage.otherOrders
    const fills = parsedMessage.fills
    const incomingBalanceStr = parsedMessage.incomingBalance
    const makerBalanceStr = parsedMessage.makerBalances

    const parsedincomingBalance = JSON.parse(incomingBalanceStr);
    const incomingBalance = Object.fromEntries(parsedincomingBalance)
    console.log(incomingBalance)

    const makerBalances: Record<string, Record<string, any>> = makerBalanceStr ? Object.fromEntries(
      Object.entries(JSON.parse(makerBalanceStr)).map(
        ([userId, entries]) => [
          userId,
          Object.fromEntries(entries as [string, { available: number; locked: number }][]),
        ],
      ),
    ) : {}
    console.log(makerBalances)

    try {
      // update balances using userId
      const incoming = await prismaClient.balances.upsert({
        where: { userId: order.userId, },
        update: {
          SOL_avail: incomingBalance.SOL.available,
          SOL_lock: incomingBalance.SOL.locked,
          ETH_avail: incomingBalance.ETH.available,
          ETH_lock: incomingBalance.ETH.locked,
          USD_avail: incomingBalance.USD.available,
          USD_lock: incomingBalance.USD.locked,
          BTC_avail: incomingBalance.BTC.available,
          BTC_lock: incomingBalance.BTC.locked,
        },
        create: {
          userId: parsedMessage.userId,
          SOL_avail: incomingBalance.SOL.available,
          SOL_lock: incomingBalance.SOL.locked,
          ETH_avail: incomingBalance.ETH.available,
          ETH_lock: incomingBalance.ETH.locked,
          USD_avail: incomingBalance.USD.available,
          USD_lock: incomingBalance.USD.locked,
          BTC_avail: incomingBalance.BTC.available,
          BTC_lock: incomingBalance.BTC.locked,
        },
      })
      console.log(incoming)

      if (parsedMessage.createOrCancel == 'create') {
        // create incoming order
        const createdOrder = await prismaClient.orders.create({
          data: {
            orderId: order.orderId,
            market: order.market,
            price: order.price,
            quantity: order.quantity,
            type: order.type,
            side: order.side,
            filledQty: order.filledQty,
            createdAt: order.createdAt,
            status: order.status,
            user: {
              connect: { userId: order.userId }
            }
          }
        })
        console.log(createdOrder)
        // update other side orders if there
        if (otherOrders && otherOrders?.length > 0) {
          const otherorderss = await prismaClient.$transaction(otherOrders.map((otherOrder) =>
            prismaClient.orders.update({
              where: { orderId: otherOrder.orderId, },
              data: {
                userId: otherOrder.userId,
                market: otherOrder.market,
                price: otherOrder.price,
                quantity: otherOrder.quantity,
                type: otherOrder.type,
                side: otherOrder.side,
                filledQty: otherOrder.filledQty,
                status: otherOrder.status,
                createdAt: otherOrder.createdAt,
              },
            })
          )
          )
          console.log(otherorderss)
        }
        // create fills
        if (fills && fills?.length > 0) {
          const fillss = await prismaClient.fills.createMany({
            data: fills
          })
          console.log(fillss)
        }

        if (Object.keys(makerBalances).length > 0) {
          const makerBalanceUpdates = Object.entries(makerBalances).map(([userId, balance]) =>
            prismaClient.balances.upsert({
              where: { userId: Number(userId) },
              update: {
                SOL_avail: balance.SOL?.available,
                SOL_lock: balance.SOL?.locked,
                ETH_avail: balance.ETH?.available,
                ETH_lock: balance.ETH?.locked,
                USD_avail: balance.USD?.available,
                USD_lock: balance.USD?.locked,
                BTC_avail: balance.BTC?.available,
                BTC_lock: balance.BTC?.locked,
              },
              create: {
                userId: Number(userId),
                SOL_avail: balance.SOL?.available,
                SOL_lock: balance.SOL?.locked,
                ETH_avail: balance.ETH?.available,
                ETH_lock: balance.ETH?.locked,
                USD_avail: balance.USD?.available,
                USD_lock: balance.USD?.locked,
                BTC_avail: balance.BTC?.available,
                BTC_lock: balance.BTC?.locked,
              },
            }),
          )

          const updatedMakerBalances = await prismaClient.$transaction(makerBalanceUpdates)
          console.log(updatedMakerBalances)

        }
      } else {
        // update order
        const updatedOrder = await prismaClient.orders.update({
          where: { orderId: order.orderId },
          data: {
            orderId: order.orderId,
            userId: parsedMessage.userId,
            market: order.market,
            price: order.price,
            quantity: order.quantity,
            type: order.type,
            side: order.side,
            filledQty: order.filledQty,
            createdAt: order.createdAt,
            status: order.status
          }
        })
        console.log(updatedOrder)
      }
    } catch (error) {
      console.log(error)
    }
  }
}