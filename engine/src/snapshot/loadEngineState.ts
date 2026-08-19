import { storeClient } from '../config/redis'
import { Orders, Fills } from '../Types/OrderFillsType'
import { Balances, OrderBook } from '../Types/types'

export default async function loadEngineState(): Promise<string> {
  console.log('loading engine state')

  const storedLastId = await storeClient.get('engine:lastId')
  const restoredLastId = storedLastId ?? '$'

  const storedFills = await storeClient.get('engine:fills')
  if (storedFills) {
    Fills.length = 0
    Fills.push(...JSON.parse(storedFills))
  }

  const storedOrders = await storeClient.get('engine:orders')
  if (storedOrders) {
    Orders.clear()
    for (const [orderId, order] of JSON.parse(storedOrders)) {
      Orders.set(orderId, order)
    }
  }

  const storedOrderBook = await storeClient.get('engine:orderbook')
  if (storedOrderBook) {
    const orderbook = JSON.parse(storedOrderBook) as Array<[
      'SOL' | 'BTC' | 'ETH',
      { bids: Array<[number, { totalQty: number; orders: any[] }]>, asks: Array<[number, { totalQty: number; orders: any[] }]> }
    ]>

    OrderBook.clear()
    for (const [asset, book] of orderbook) {
      OrderBook.set(asset, {
        bids: new Map(book.bids),
        asks: new Map(book.asks),
      })
    }
  }

  const storedBalance = await storeClient.get('engine:balances')
  if (storedBalance) {
    const balance = JSON.parse(storedBalance) as Array<[
      number,
      Array<[
        'SOL' | 'BTC' | 'ETH' | 'USD',
        { available: number; locked: number }
      ]>
    ]>

    Balances.clear()
    for (const [userId, balanceList] of balance) {
      Balances.set(userId, new Map(balanceList))
    }
  }

  console.log('engine state loaded')
  return restoredLastId
}