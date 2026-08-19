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
    const stringifiedMessage = message.message.data
    const parsedMessage: response = JSON.parse(stringifiedMessage)
    console.log(parsedMessage)

    const order = parsedMessage.order
    const otherOrders = parsedMessage.otherOrders
    const fills = parsedMessage.fills
    const buyerBalanceStr = parsedMessage.buyerBalance
    const sellerBalanceStr = parsedMessage.sellerBalance

    const parsedBuyerBalance = JSON.parse(buyerBalanceStr);
    const buyerBalance = Object.fromEntries(parsedBuyerBalance)
    console.log(buyerBalance)

    const parsedSellerBalance = JSON.parse(sellerBalanceStr as string);
    const sellerBalance: Record<string, any> | null = sellerBalanceStr ? Object.fromEntries(parsedSellerBalance) : null
    console.log(sellerBalance)

    try {
      // update balances using userId
      const buyer = await prismaClient.balances.upsert({
        where: {
          userId: order.userId,
        },
        update: {
          SOL_avail: buyerBalance.SOL.available,
          SOL_lock: buyerBalance.SOL.locked,
          ETH_avail: buyerBalance.ETH.available,
          ETH_lock: buyerBalance.ETH.locked,
          USD_avail: buyerBalance.USD.available,
          USD_lock: buyerBalance.USD.locked,
          BTC_avail: buyerBalance.BTC.available,
          BTC_lock: buyerBalance.BTC.locked,
        },
        create: {
          userId: parsedMessage.userId,
          SOL_avail: buyerBalance.SOL.available,
          SOL_lock: buyerBalance.SOL.locked,
          ETH_avail: buyerBalance.ETH.available,
          ETH_lock: buyerBalance.ETH.locked,
          USD_avail: buyerBalance.USD.available,
          USD_lock: buyerBalance.USD.locked,
          BTC_avail: buyerBalance.BTC.available,
          BTC_lock: buyerBalance.BTC.locked,
        },
      })
      console.log(buyer)

      if (parsedMessage.createOrCancel == 'create') {
        // create order
        const createdOrder = await prismaClient.orders.create({
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
        console.log(createdOrder)
        // create otherorders if there
        if (otherOrders && otherOrders?.length > 0) {
          const otherorderss = await prismaClient.orders.createMany({
            data: otherOrders
          })
          console.log(otherorderss)
        }
        // create fills
        if (fills && fills?.length > 0) {
          const fillss = await prismaClient.fills.createMany({
            data: fills
          })
          console.log(fillss)
        }
        if (sellerBalance != null || sellerBalance != undefined) {
          const seller = await prismaClient.balances.upsert({
            where: {
              userId: parsedMessage.userId,
            },
            update: {
              SOL_avail: sellerBalance.SOL.available,
              SOL_lock: sellerBalance.SOL.locked,
              ETH_avail: sellerBalance.ETH.available,
              ETH_lock: sellerBalance.ETH.locked,
              USD_avail: sellerBalance.USD.available,
              USD_lock: sellerBalance.USD.locked,
              BTC_avail: sellerBalance.BTC.available,
              BTC_lock: sellerBalance.BTC.locked,
            },
            create: {
              userId: parsedMessage.userId,
              SOL_avail: sellerBalance.SOL.available,
              SOL_lock: sellerBalance.SOL.locked,
              ETH_avail: sellerBalance.ETH.available,
              ETH_lock: sellerBalance.ETH.locked,
              USD_avail: sellerBalance.USD.available,
              USD_lock: sellerBalance.USD.locked,
              BTC_avail: sellerBalance.BTC.available,
              BTC_lock: sellerBalance.BTC.locked,
            },
          })
          console.log(seller)
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