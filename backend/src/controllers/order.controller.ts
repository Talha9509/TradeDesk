import type { Request, Response } from 'express'
import { prismaClient } from '../config/db'
import { BuyOrder, getOrCreateBalance, OrderBook, Orders, Fills, restOrderOnBook } from '../types/types'
import { client } from '../config/redis'

export const BuySell = async (req: Request, res: Response) => {
  const userId = req.userId
  // const { stockName, type, side, price, quantity } = req.body
  const validatedInput = BuyOrder.safeParse(req.body)
  if (!validatedInput.success) return res.status(400).json({ message: "Invalid Inputs" })
  const data = validatedInput.data
  
  await client.lPush('incoming-queue', JSON.stringify({ data }))

  return res.json({ meessage: 'Order placed' })
}
















