export type Order = {
  id: number,
  userId: number,
  market: "SOL" | "BTC" | "ETH",
  price: number,
  quantity: number,
  type: "limit" | "market",
  side: "buy" | "sell",
  filledQty: number,
  status: "Open" | "Filled" | "Cancelled",
  createdAt: string
}
export const Orders: Order[] = []

export type Fill = { 
  quantity: number, 
  side: "buy" | "sell", 
  type: "maker" | "taker", 
  userId: number, 
  price: number, 
  asset: "SOL" | "BTC" | "ETH", 
  orderId: number, 
  createdAt: string 
}
export const Fills: Fill[] = []