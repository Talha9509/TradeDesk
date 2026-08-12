
export type EngineCommandType =
  | "create_order"
  | "get_user_balance"

export type OrderType = {
  stockName: "SOL" | "BTC" | "ETH",
  type: "limit" | "market",
  side: "buy" | "sell",
  price: number,
  quantity: number
}

export type EngineRequest = {
  data: OrderType,
  queueIdentifier: number, 
  QUEUE_ID: number, 
  userId: number,
  function: EngineCommandType
}

export interface EngineResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
  queueIdentifier: number, 
  QUEUE_ID: number,
}


export const Balances: Record<number, any> = {}
// export const Balance: Map<number, any> = {}

// creates a balance with some stock the first time we see a userId, returns it either way
export function getOrCreateBalance(userId: number) {
  if (!Balances[userId]) {
    Balances[userId] = {
      USD: { available: 1000, locked: 0 },
      SOL: { available: 100, locked: 0 },
      BTC: { available: 100, locked: 0 },
      ETH: { available: 100, locked: 0 }
    }
  }
  return Balances[userId]
}

// type PriceLevel = {
//     totalQty: number
//     orders: Order[]
// }

// type OrderBookSide = Map<number, PriceLevel>

// type OrderBook = {
//     bids: OrderBookSide
//     asks: OrderBookSide
// }

export const Orders: any[] = []
export const Fills: any[] = []

export const OrderBook: Record<string, any> = {
  SOL: { bids: {}, asks: {} },
  BTC: { bids: {}, asks: {} },
  ETH: { bids: {}, asks: {} }
}

// the ONLY function allowed to touch OrderBook[...][...][price].Orders directly.
// used both for seeding test data and for resting a leftover limit order later.
export function restOrderOnBook(order: any) {
  const side = order.side === "buy" ? "bids" : "asks"
  const book = OrderBook[order.market][side]
  const priceKey = order.price
  if (!book[priceKey]) {
    book[priceKey] = { totalQty: 0, Orders: [] }   // fresh array — never reused from elsewhere
  }
  book[priceKey].Orders.push(order)
  book[priceKey].totalQty += (order.quantity - order.filledQty)
}

// remove this, instead, first buy on limit then sell on market to test it
// example seed data, now going through the same path real orders will:
// restOrderOnBook({
//   id: 1, userId: 2, market: "SOL", price: 140.6, quantity: 4, type: "limit",
//   side: "sell", filledQty: 0, status: "Open", createdAt: new Date().toISOString()
// })


