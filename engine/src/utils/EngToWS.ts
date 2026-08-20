import { streamClient } from '../config/redis'
import { engToWS } from '../Types/EngineTypes'

export default async function EngToWS() {
  console.log("sending to ws")

  const ToWS = await streamClient.xAdd(engToWS, '*', { abc: 'abc' })
  console.log(ToWS)
}