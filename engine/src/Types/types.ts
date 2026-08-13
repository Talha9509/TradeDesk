import { type OrderRecord } from './OrderFillsType'

export type availLocked = { 
  available: number, 
  locked: number
}

export type balanceMarket = 'SOL' | 'BTC' | 'ETH' | 'USD'
type balance = Map<balanceMarket, availLocked>

export const Balances: Map<number, balance> = new Map()

type PriceLevel = { totalQty: number, orders: OrderRecord[] }

type OrderBookSide = Map<number, PriceLevel>
type OrderBook = { bids: OrderBookSide, asks: OrderBookSide }

// export const OrderBook: Record<string, any> = {
//   SOL: { bids: {}, asks: {} },
//   BTC: { bids: {}, asks: {} },
//   ETH: { bids: {}, asks: {} }
// }

type market = 'SOL' | 'BTC' | 'ETH'
function createEmptyOrderBook(): OrderBook {
  return { bids: new Map(), asks: new Map() }
}

export const OrderBook: Map<market, OrderBook> = new Map([
  ["SOL", createEmptyOrderBook()],
  ["BTC", createEmptyOrderBook()],
  ["ETH", createEmptyOrderBook()]
])


