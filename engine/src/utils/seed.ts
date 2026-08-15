import { Balances, OrderBook } from '../Types/types'
import { Orders, type OrderRecord } from '../Types/OrderFillsType'
import restOrderOnBook from './restOrderonBook'

const makeOrder = (
  userId: number,
  market: 'SOL' | 'BTC' | 'ETH',
  side: 'buy' | 'sell',
  price: number,
  quantity: number,
): OrderRecord => ({
  orderId: crypto.randomUUID(),
  userId,
  market,
  price,
  quantity,
  type: 'limit',
  side,
  filledQty: 0,
  status: 'Open',
  fills: [],
  createdAt: new Date().toISOString(),
})

export default function seedEngine() {
  const seedBalances = [
    { userId: 1, USD: 50000, SOL: 25, BTC: 20, ETH: 20 },
    { userId: 2, USD: 60000, SOL: 15, BTC: 3, ETH: 18 },
    { userId: 3, USD: 70000, SOL: 30, BTC: 4, ETH: 12 },
    { userId: 4, USD: 45000, SOL: 20, BTC: 2, ETH: 25 },
  ]

  for (const user of seedBalances) {
    Balances.set(user.userId, new Map([
      ['USD', { available: user.USD, locked: 0 }],
      ['SOL', { available: user.SOL, locked: 0 }],
      ['BTC', { available: user.BTC, locked: 0 }],
      ['ETH', { available: user.ETH, locked: 0 }],
    ]))
  }

  // these all are limit orders
  const seedOrders: OrderRecord[] = [
    makeOrder(1, 'SOL', 'buy', 100, 5),
    makeOrder(2, 'SOL', 'sell', 101, 4),
    makeOrder(3, 'SOL', 'sell', 103, 8),
    makeOrder(1, 'BTC', 'buy', 56000, 0.5),
    makeOrder(2, 'BTC', 'sell', 57000, 1),
    makeOrder(3, 'ETH', 'buy', 1750, 4),
    makeOrder(4, 'ETH', 'sell', 1780, 6),
  ]

  for (const order of seedOrders) {
    Orders.set(order.orderId, order)
    restOrderOnBook(order)
  }

  console.log(Object.fromEntries(OrderBook))
  console.log('[engine seed] initialized balances and order book with', Orders.size, 'orders')
}
