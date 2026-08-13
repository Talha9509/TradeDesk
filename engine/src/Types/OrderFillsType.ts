export type OrderRecord = {
  orderId: string,
  userId: number,
  market: "SOL" | "BTC" | "ETH",
  price: number,
  quantity: number,
  type: "limit" | "market",
  side: "buy" | "sell",
  filledQty: number,
  status: "Open" | "Filled" | "Cancelled",
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