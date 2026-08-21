import { WebSocketServer, type WebSocket } from 'ws'
import { StreamClient } from './config/redis'
import createConsumerGroup from './utils/createConsumerGroup'
import { type update, type data } from './Types/types'

const wss = new WebSocketServer({ port: 8080 })

export const GROUP_ID = Math.round(Math.random() * 100)
const streamKey = 'engine_to_ws'
const groupName = `ws-${GROUP_ID}`
const consumerName = `worker_${process.pid}`;

await createConsumerGroup(streamKey, groupName)

const activeSubscriptions: Record<string, WebSocket[]> = {}

async function poll() {
  while (1) {
    const responses = await StreamClient.xReadGroup(groupName, consumerName,
      { key: streamKey, id: '>' },
      { COUNT: 10, BLOCK: 0 }
    )
    if (!responses) {
      poll()
    } else {
      for (const response of responses) {
        for (const message of response.messages) {
          const parsedUpdate: update = JSON.parse(message.message.update)
          console.log(parsedUpdate)
          activeSubscriptions[parsedUpdate.stream]?.forEach(ws => ws.send(parsedUpdate.data))
        }
      }
      poll()
    }
  }
}
poll()

wss.on('connection', async (socket: WebSocket) => {
  socket.on("message", (data: string) => {
    const parsedData: data = JSON.parse(data)
    // {"method":"SUBSCRIBE","params":["depth.BTC"]}
    if (parsedData.method == 'SUBSCRIBE') {
      parsedData.params.forEach((param) => {
        if (!activeSubscriptions[param]) {
          activeSubscriptions[param] = []
        }
        activeSubscriptions[param].push(socket)
      })
      console.log("subscribed")
      console.log(JSON.stringify(parsedData))
      console.log(JSON.stringify(activeSubscriptions))
    } else {
      parsedData.params.forEach((param) => {
        if (!activeSubscriptions[param]) {
          activeSubscriptions[param] = []
        }
        activeSubscriptions[param] = activeSubscriptions[param].filter(websocket => websocket !== socket)
      })
      console.log("unsubscribed")
      console.log(JSON.stringify(activeSubscriptions))
    }
  })
})