import { storeClient } from '../config/redis'
import { Orders, Fills } from '../Types/OrderFillsType'
import { Balances, OrderBook } from '../Types/types'
import { lastId } from '../index'

export default async function persistData() {
  const storedId = await storeClient.set('engine:lastId', lastId)
  const storedFills = await storeClient.set('engine:fills', JSON.stringify(Fills))
  
  const OrdersObject = Object.fromEntries(Orders)
  const storedOrders = await storeClient.set('engine:orders', JSON.stringify(OrdersObject))

  const storedOrderBook = await storeClient.set("engine:orderbook",
    JSON.stringify(
      [...OrderBook.entries()].map(([asset, book]) => ({
        asset, bids: [...book.bids.entries()], asks: [...book.asks.entries()],
      })),
    )
  );
  
  const storedBalance = await storeClient.set("engine:orderbook",
    JSON.stringify(
      [...Balances.entries()].map(([userId, balance]) => ({
        userId, 
        balance: [...balance.entries().map(([asset, availLocked]) => ({
          asset, available: availLocked.available, locked: availLocked.locked
        }))]
      })),
    )
  );
  console.log(storedFills, storedId, storedOrderBook, storedOrders, storedBalance)
  
}