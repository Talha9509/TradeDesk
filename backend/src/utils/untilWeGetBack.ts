import { subscriberClient } from '../config/redis'
import type { EngineResponse } from '../types/types'
// i want
// one while loop to get all data from queue

let pendingResolves: Record<number, any> = {}
export const QUEUE_ID = Math.round(Math.random() * 100)

async function pollQueue(){
  const response = await subscriberClient.brPop('response-queue-' + QUEUE_ID, 5)
  if (!response) {
    pollQueue()
  } else {
    console.log(response)
  
    const res: EngineResponse = await JSON.parse(response.element)
    console.log(res)
    const data = res.data
    if(res.QUEUE_ID == QUEUE_ID){
      if (res.ok == true && res.queueIdentifier && pendingResolves[res.queueIdentifier]) {
        pendingResolves[res.queueIdentifier].resolve(data)
      } else {
        pendingResolves[res.queueIdentifier].reject(new Error(res.error))
      }
      pollQueue()
    }
  }
}
pollQueue()

export const untilWeGetBack = (identifier: any) => {
  return new Promise((resolve, reject) => {
    pendingResolves[identifier] = { resolve, reject }
  })
}