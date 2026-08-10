import { createClient } from 'redis'

const client = await createClient()
  .on("error", (err) => console.log("Error connecting to redis", err))
  .connect()

