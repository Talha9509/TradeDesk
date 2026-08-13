import type { Request, Response } from 'express'
import { Order, type EngineRequest } from '../types/types'
import { client } from '../config/redis'
import { untilWeGetBack, QUEUE_ID } from '../utils/untilWeGetBack'

export const BuySell = async (req: Request, res: Response) => {
  const userId = req.userId!
  const validatedInput = Order.safeParse(req.body)
  if (!validatedInput.success) return res.status(400).json({ message: "Invalid Inputs" })
  const data = validatedInput.data
  const queueIdentifier = Math.round(Math.random() * 1000)
  
  try {
    const pendingResponse = untilWeGetBack(queueIdentifier)
    const ToEngine: EngineRequest = { payload: data, queueIdentifier, QUEUE_ID, userId, function: 'create_order' }
    await client.lPush('incoming-queue', JSON.stringify(ToEngine))

    const returnedData = await pendingResponse;
    console.log("returnedData: "+JSON.stringify(returnedData))
  
    // @ts-ignore
    return res.json({ message: 'Order placed', filledQty: returnedData?.filledQty })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ meessage: 'Internal Server Error' })
  }
}


export const DeleteOrder = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string
  const userId = req.userId!;
  const queueIdentifier = Math.round(Math.random() * 1000)
  const payload = { orderId: orderId }
  
  try {
    const pendingResponse = untilWeGetBack(queueIdentifier)
    const ToEngine: EngineRequest = { payload, queueIdentifier, QUEUE_ID, userId, function: 'cancel_order' }
    await client.lPush('incoming-queue', JSON.stringify(ToEngine))

    const returnedData = await pendingResponse;
    console.log("returnedData: " + JSON.stringify(returnedData))

    // @ts-ignore
    return res.json({ message: 'Order Cancelled', filledQty: returnedData?.filledQty })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ meessage: 'Internal Server Error' })
  }
}


export const getOrderbyId = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string
  const userId = req.userId!
  const queueIdentifier = Math.round(Math.random() * 1000)
  const payload = { orderId: orderId }
  
  try {
    const pendingResponse = untilWeGetBack(queueIdentifier)
    const ToEngine: EngineRequest = { payload, queueIdentifier, QUEUE_ID, userId, function: 'get_order' }
    await client.lPush('incoming-queue', JSON.stringify(ToEngine))

    const returnedData = await pendingResponse;
    console.log("returnedData: " + JSON.stringify(returnedData))

    return res.json({ returnedData })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ meessage: 'Internal Server Error' })
  }
}


export const getBalance = async (req: Request, res: Response) => {
  const userId = req.userId!
  const queueIdentifier = Math.round(Math.random() * 1000)
  const payload = {}
  
  try {
    const pendingResponse = untilWeGetBack(queueIdentifier)
    const ToEngine: EngineRequest = { payload, queueIdentifier, QUEUE_ID, userId, function: 'get_user_balance' }
    await client.lPush('incoming-queue', JSON.stringify(ToEngine))

    const returnedData = await pendingResponse;
    console.log("returnedData: " + JSON.stringify(returnedData))

    return res.json({ returnedData })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ meessage: 'Internal Server Error' })
  }
}















