import { WebSocketServer } from 'ws'
import { StreamClient } from './config/redis'
import createConsumerGroup from './utils/createConsumerGroup'

const wss = new WebSocketServer({ port: 8080 })

export const GROUP_ID = Math.round(Math.random() * 100)
const streamKey = 'engine_to_ws'
const groupName = `ws-${GROUP_ID}`
const consumerName = `worker_${process.pid}`; 

await createConsumerGroup(streamKey, groupName)

async function poll() {
  while (1) {
    const responses = await StreamClient.xReadGroup(groupName, consumerName,
      { key: streamKey, id: '>' },
      { COUNT: 10, BLOCK: 0 }
    )
    if (!responses) {
      poll()
    } else {
      for(const response of responses){
        for(const message of response.messages){
          console.log(message.message)
        }
      }
      poll()
    }
  }
}
poll()

wss.on('connection', async (socket) => {

})