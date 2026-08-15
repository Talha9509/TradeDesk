
export type EngineCommandType =
  | "create_order"
  | "cancel_order"
  | "get_user_balance"
  | "get_order"
  | "get_depth"

export type OrderType = {
  stockName: "SOL" | "BTC" | "ETH",
  type: "limit" | "market",
  side: "buy" | "sell",
  price: number | null,
  quantity: number
}

export type EngineRequest = {
  payload: Record<string | number, any>,
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