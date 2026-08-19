import persistData from './persistance'
import { storeClient } from '../config/redis'
import { lastId } from '../index'

let changesCount = 0;
export default async function snapshot() {
  changesCount++

  if (changesCount % 2 !== 0) return
  await persistData(lastId)

  try {
    await storeClient.sendCommand(['BGSAVE'])
    console.log('snapshot is starting')
  } catch (error) {
    if (error instanceof Error && error.message.includes('Background save already in progress')) {
      console.log('Redis snapshot already in progress. Engine state is saved in Redis memory; skipping this snapshot.')
      return
    }
    throw error
  }
}