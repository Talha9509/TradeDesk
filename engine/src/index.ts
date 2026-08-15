import handleEngine from './Engine/handleEngine'
import type { EngineRequest, EngineResponse } from './Types/EngineTypes'
import { subscriberClient, publisherClient } from './config/redis'
import seedEngine from './utils/seed'

seedEngine()

while(1){
  const response = await subscriberClient.brPop('incoming-queue', 5)
  if(!response) continue;

  const res: EngineRequest = await JSON.parse(response.element)
  console.log(res.payload, res.queueIdentifier)

  try {
    const result = await handleEngine(res)
    const ToBackend: EngineResponse = { 
      ok: true, 
      queueIdentifier: res.queueIdentifier,
      QUEUE_ID: res.QUEUE_ID,
      data: result
    }
    await publisherClient.lPush(`response-queue-${res.QUEUE_ID}`, JSON.stringify(ToBackend))
  } catch (error) {
    console.log(error)
    const ToBackend: EngineResponse = {
      ok: false, 
      queueIdentifier: res.queueIdentifier, 
      QUEUE_ID: res.QUEUE_ID, 
      error: error instanceof Error ? error.message : "engine_error" 
    }
    await publisherClient.lPush(`response-queue-${res.QUEUE_ID}`, JSON.stringify(ToBackend))
  }
}