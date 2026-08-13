import { Orders } from "../Types/OrderFillsType"


export const GetOrder = (data: Record<string | number, any>, userId: number) => {
  // Algorithm:
  // 1. get order by id and its fills
  const reqOrder = Orders.get(data.orderId)
  const matchUserId = reqOrder?.userId == userId
  if(!matchUserId) throw Error('The Order does not belong to you')
  return { reqOrder }
}