import { createClient } from 'redis'

export const dbclient = await createClient()
  .on("error", (err) => console.log('Error connecting to redis', err))
  .connect()