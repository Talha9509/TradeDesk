import { subscriberClient } from '../config/redis'
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
  
    const res = await JSON.parse(response.element)
    console.log(res)
    const data = res.data
    // const id = res.identifier
    if(res.QUEUE_ID == QUEUE_ID){
      if (res.identifier && pendingResolves[res.identifier]) {
        pendingResolves[res.identifier](data)
      }
      pollQueue()
    }
  }
}
pollQueue()

export const untilWeGetBack = (identifier: any) => {
  return new Promise((resolve, reject) => {
    pendingResolves[identifier] = resolve
  })
}