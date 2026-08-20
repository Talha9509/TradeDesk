export type OrderRecord = {
  orderId: string,
  userId: number,
  market: "SOL" | "BTC" | "ETH",
  price: number,
  quantity: number,
  type: "limit" | "market",
  side: "buy" | "sell",
  filledQty: number,
  status: "Open" | "Filled" | "Cancelled" | "Partially_filled",
  fills: Fill[]
  createdAt: string
}
export const Orders = new Map<string, OrderRecord>()

export type Fill = { 
  quantity: number, 
  side: "buy" | "sell", 
  userId: number, 
  price: number, 
  asset: "SOL" | "BTC" | "ETH", 
  buyOrderId: string,
  sellOrderId: string,
  fillId: string,
  createdAt: string 
}
export const Fills: Fill[] = []

export type availLocked = { 
  available: number, 
  locked: number
}

export type balanceMarket = 'SOL' | 'BTC' | 'ETH' | 'USD'
type balance = Map<balanceMarket, availLocked>
type userId = number

export const Balances: Map<userId, balance> = new Map()

export type response = { 
  userId: number,
  order: OrderRecord, 
  otherOrders?: OrderRecord[] | null, 
  fills: Fill[] | null, 
  incomingBalance: string, 
  makerBalances?: string | null,
  createOrCancel: string
}