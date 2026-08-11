import { createClient } from 'redis'

export const client = await createClient()
  .on("error", (err) => console.log("Error connecting to redis", err))
  .connect()

  export const subscriberClient = await createClient()
  .on("error", (err) => console.log("Error connecting to redis", err))
  .connect()

