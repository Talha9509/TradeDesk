import { createClient } from 'redis'

export const subscriberClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

export const publisherClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()
