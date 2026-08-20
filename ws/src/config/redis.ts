import { createClient } from 'redis'

export const StreamClient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()