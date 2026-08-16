import { Balances, OrderBook } from '../engine/src/Types/types'
import { Orders, Fills } from '../engine/src/Types/OrderFillsType'
import type { balanceMarket, availLocked } from '../engine/src/Types/types'

export function resetState() {
  Balances.clear()
  Orders.clear()
  Fills.length = 0
  OrderBook.forEach(book => {
    book.bids.clear()
    book.asks.clear()
  })
}

export function seedBalance(userId: number, balances?: { USD?: number; SOL?: number; BTC?: number; ETH?: number }) {
  const defaultBalances = { USD: 10000, SOL: 100, BTC: 100, ETH: 100 }
  const mergedBalances = { ...defaultBalances, ...balances }

  Balances.set(userId, new Map<balanceMarket, availLocked>([
    ['USD', { available: mergedBalances.USD, locked: 0 }],
    ['SOL', { available: mergedBalances.SOL, locked: 0 }],
    ['BTC', { available: mergedBalances.BTC, locked: 0 }],
    ['ETH', { available: mergedBalances.ETH, locked: 0 }],
  ]))
}

export function getBalance(userId: number, asset: balanceMarket) {
  return Balances.get(userId)?.get(asset)
}

export function createOrderPayload(overrides?: any) {
  return {
    stockName: 'SOL',
    type: 'limit',
    side: 'buy',
    price: 100,
    quantity: 10,
    ...overrides,
  }
}
