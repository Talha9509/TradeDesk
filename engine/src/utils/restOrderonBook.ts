import { type Order, OrderBook } from '../Types/types'

// the ONLY function allowed to touch OrderBook[...][...][price].Orders directly.
// used both for seeding test data and for resting a leftover limit order later.
export default function restOrderOnBook(order: Order) {
  const side = order.side === "buy" ? "bids" : "asks"
  const marketBook = OrderBook.get(order.market)
  if (!marketBook) {
    throw new Error(`Unknown market: ${order.market}`)
  }
  const book = marketBook[side]

  let level = book.get(order.price)
  if (!level) {
    level = { totalQty: 0, orders: [] }
    book.set(order.price, level)
  }

  level.orders.push(order)
  level.totalQty += order.quantity - order.filledQty
}