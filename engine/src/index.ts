import { createClient } from 'redis'

const client = await createClient()
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
}