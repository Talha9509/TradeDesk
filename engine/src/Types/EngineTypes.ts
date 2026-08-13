
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

export type EngineResponse = {
  ok: boolean;
  data?: unknown;
  error?: string;
  queueIdentifier: number, 
  QUEUE_ID: number,
}