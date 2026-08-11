import type { Request, Response } from 'express'
import { prismaClient } from '../config/db'
import { BuyOrder, getOrCreateBalance, OrderBook, Orders, Fills, restOrderOnBook } from '../types/types'
import { client } from '../config/redis'
import { untilWeGetBack, QUEUE_ID } from '../utils/untilWeGetBack'

export const BuySell = async (req: Request, res: Response) => {
  const userId = req.userId
  // const { stockName, type, side, price, quantity } = req.body
  const validatedInput = BuyOrder.safeParse(req.body)
  if (!validatedInput.success) return res.status(400).json({ message: "Invalid Inputs" })
  const data = validatedInput.data
  const queueIdentifier = Math.round(Math.random() * 1000)
  
  try {
  await client.lPush('incoming-queue', JSON.stringify({ data, queueIdentifier, QUEUE_ID }))

    const returnedData = await untilWeGetBack(queueIdentifier)
    console.log("returnedData: "+JSON.stringify(returnedData))
  
    return res.json({ meessage: 'Order placed' })
  } catch (error) {
    console.log(error)
  }
}
















