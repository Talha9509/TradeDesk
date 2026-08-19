import { storeClient } from '../config/redis'
import { Orders, Fills } from '../Types/OrderFillsType'
import { Balances, OrderBook } from '../Types/types'

export default async function persistData(currentLastId: string) {
  const storedId = await storeClient.set('engine:lastId', currentLastId)
  const storedFills = await storeClient.set('engine:fills', JSON.stringify(Fills))
  
  const OrdersObject = [...Orders.entries()]
  const storedOrders = await storeClient.set('engine:orders', JSON.stringify(OrdersObject))

  const storedOrderBook = await storeClient.set(
    'engine:orderbook',
    JSON.stringify(
      [...OrderBook.entries()].map(([asset, book]) => [
        asset,
        {
          bids: [...book.bids.entries()],
          asks: [...book.asks.entries()],
        },
      ]),
    ),
  )

  const storedBalance = await storeClient.set(
    'engine:balances',
    JSON.stringify(
      [...Balances.entries()].map(([userId, balance]) => [
        userId,
        [...balance.entries()],
      ]),
    ),
  )

  console.log({ storedFills, storedId, storedOrderBook, storedOrders, storedBalance })
}