import { createClient } from 'redis'

export const subscriberClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

export const publisherClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

export const storeClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

export const dbClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()

