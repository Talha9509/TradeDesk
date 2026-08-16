import { Balances, OrderBook } from '../Types/types'
import { Fills, Orders } from '../Types/OrderFillsType'

const assets = ['SOL', 'BTC', 'ETH'] as const

const normalizeNumber = (value: number) => Number(value.toFixed(6))

export function getDashboardState() {
  const orderbook = Object.fromEntries(
    assets.map((market) => {
      const book = OrderBook.get(market) ?? { bids: new Map(), asks: new Map() }

      const serializeSide = (side: 'bids' | 'asks') =>
        Array.from(book[side].entries())
          .map(([price, level]) => ({
            price,
            totalQty: normalizeNumber(level.totalQty),
            orderCount: level.orders.length,
            orders: level.orders.map((order) => ({
              orderId: order.orderId,
              userId: order.userId,
              side: order.side,
              remainingQty: normalizeNumber(order.quantity - order.filledQty),
              status: order.status,
            })),
          }))
          .sort((a, b) => (side === 'bids' ? b.price - a.price : a.price - b.price))

      return [market, { bids: serializeSide('bids'), asks: serializeSide('asks') }]
    }),
  )

  const balances = Array.from(Balances.entries())
    .map(([userId, marketMap]) => {
      const row: Record<string, any> = { userId }
      for (const asset of ['USD', ...assets] as const) {
        const balance = marketMap.get(asset)
        row[asset] = {
          available: normalizeNumber(balance?.available ?? 0),
          locked: normalizeNumber(balance?.locked ?? 0),
        }
      }
      return row
    })
    .sort((a, b) => a.userId - b.userId)

  const orders = Array.from(Orders.values()).map((order) => ({
    orderId: order.orderId,
    userId: order.userId,
    market: order.market,
    side: order.side,
    type: order.type,
    price: order.price,
    quantity: normalizeNumber(order.quantity),
    filledQty: normalizeNumber(order.filledQty),
    remainingQty: normalizeNumber(order.quantity - order.filledQty),
    status: order.status,
    createdAt: order.createdAt,
  }))

  const fills = Fills.map((fill) => {
    const buyerId = fill.side === 'buy' ? fill.userId : Orders.get(fill.sellOrderId)?.userId ?? undefined
    const sellerId = fill.side === 'sell' ? fill.userId : Orders.get(fill.buyOrderId)?.userId ?? undefined

    return {
      fillId: fill.fillId,
      asset: fill.asset,
      price: fill.price,
      quantity: normalizeNumber(fill.quantity),
      buyerId,
      sellerId,
      buyOrderId: fill.buyOrderId,
      sellOrderId: fill.sellOrderId,
      createdAt: fill.createdAt,
    }
  })

  return {
    summary: {
      users: balances.length,
      markets: assets.length,
      orders: orders.length,
      fills: fills.length,
    },
    balances,
    orderbook,
    orders,
    fills,
  }
}
