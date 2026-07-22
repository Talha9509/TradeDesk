import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6, "Min 6 characters")
})

export const SigninSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6, "Min 6 characters")
})

export const BuyOrder = z.object({
  stockName: z.enum(["SOL", "BTC", "ETH"]),
  type: z.enum(["limit", "market"]),
  side: z.enum(["buy", "sell"]),
  price: z.number(),
  quantity: z.number()
})

export const Balances: Record<number, any> = {}

// creates a zeroed balance the first time we see a userId, returns it either way
export function getOrCreateBalance(userId: number) {
  if (!Balances[userId]) {
    Balances[userId] = {
      USD: { available: 0, locked: 0 },
      SOL: { available: 0, locked: 0 },
      BTC: { available: 0, locked: 0 },
      ETH: { available: 0, locked: 0 }
    }
  }
  return Balances[userId]
}
// seed user 1 for testing, through the same function everything else uses
Object.assign(getOrCreateBalance(1), {
  USD: { available: 10000, locked: 0 },
  SOL: { available: 200, locked: 0 }
})

Object.assign(getOrCreateBalance(6), {
  USD: { available: 10000, locked: 0 },
  SOL: { available: 200, locked: 0 }
})

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


