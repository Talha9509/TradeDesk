import { createClient } from 'redis'

const client = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

const publisherClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

const BALANCES = {}

const ORDERBOOK = {
  SOL: {},
  BTC: {},
  ETH: {}
}

while(1){
  const response = await client.brPop('incoming-queue', 5)
  if(!response) continue;

  const res = await JSON.parse(response.element)
  console.log(res.data)
  const data = res.data
  const identifier = res.queueIdentifier

  await publisherClient.lPush('response-queue-' + res.QUEUE_ID, JSON.stringify({ data, identifier: res.queueIdentifier, QUEUE_ID: res.QUEUE_ID }))
}