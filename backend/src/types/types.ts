import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6, "Min 6 characters")
})

export const SigninSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6, "Min 6 characters")
})

export const Order = z.object({
  stockName: z.enum(["SOL", "BTC", "ETH"]),
  type: z.enum(["limit", "market"]),
  side: z.enum(["buy", "sell"]),
  price: z.number(),
  quantity: z.number()
})

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

export type EngineCommandType =
  | "create_order"
  | "cancel_order"
  | "get_user_balance"
  | "get_order"
