export type OrderRecord = {
  orderId: string,
  userId: number,
  market: "SOL" | "BTC" | "ETH",
  price: number,
  // averagePrice: number,
  quantity: number,
  type: "limit" | "market",
  side: "buy" | "sell",
  filledQty: number,
  status: "Open" | "Filled" | "Cancelled" | "Partially-filled",
  // partially filled means some filled and cancelled
  // open means some filled or not yet filled but order open
  fills: Fill[]
  createdAt: string
}
export const Orders = new Map<string, OrderRecord>()

export type Fill = { 
  quantity: number, 
  side: "buy" | "sell", 
  // type: "maker" | "taker", 
  userId: number, 
  price: number, 
  asset: "SOL" | "BTC" | "ETH", 
  buyOrderId: string,
  sellOrderId: string,
  fillId: string,
  createdAt: string 
}
export const Fills: Fill[] = []