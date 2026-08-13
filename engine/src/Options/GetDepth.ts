import { OrderBook } from "../Types/types"


export const GetDepth = (data: Record<string | number, any>) => {
  // Algorithm:
  // 1. get depth of asset from orderbook
  const asset = data.asset
  const assetDepth = OrderBook.get(asset)
  if (!assetDepth) return { bids: [], asks: [] }

  return {
    bids: Array.from(assetDepth.bids.entries()).map(([price, level]) => ({
      price,
      totalQty: level.totalQty,
      totalOrders: level.orders.length
    })),
    asks: Array.from(assetDepth.asks.entries()).map(([price, level]) => ({
      price,
      totalQty: level.totalQty,
      totalOrders: level.orders.length
    }))
  }
}