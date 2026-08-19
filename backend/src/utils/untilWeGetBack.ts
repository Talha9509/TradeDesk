import { subscriberClient } from '../config/redis'
import type { EngineResponse } from '../types/types'
import createConsumerGroup from '../utils/createConsumerGroup'
import { type MessageType } from '../types/types'

let pendingResolves: Record<number, any> = {}
export const GROUP_ID = Math.round(Math.random() * 100)
export const betoEngKey = 'backend_to_engine'
const streamKey = 'engine_to_backend'
const groupName = `backend-${GROUP_ID}`
const consumerName = `worker_${process.pid}`; 

await createConsumerGroup(streamKey, groupName)

async function pollQueue(){
  const response = await subscriberClient.xReadGroup(groupName, consumerName, 
    { key: streamKey, id: '>'}, 
    { COUNT: 2, BLOCK: 5 }
  )
  // const response = await subscriberClient.brPop('response-queue-' + QUEUE_ID, 5)
  if (!response) {
    pollQueue()
  } else {
    const messages: MessageType = response?.[0]?.messages
    console.log(messages)
  
    for(const message of messages){
      const res: EngineResponse = JSON.parse(message.message.ToBackendStringified)
      console.log(res)
      const data = res.data
      if(res.Identifier && pendingResolves[res.Identifier]){
        if (res.ok == true) {
          pendingResolves[res.Identifier].resolve(data)
        } else {
          pendingResolves[res.Identifier].reject(new Error(res.error))
        }
      }
    }
    pollQueue()
  }
}
pollQueue()

export const untilWeGetBack = (identifier: any) => {
  return new Promise((resolve, reject) => {
    pendingResolves[identifier] = { resolve, reject }
  })
}