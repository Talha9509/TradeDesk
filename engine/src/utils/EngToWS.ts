import { streamClient } from '../config/redis'
import { engToWS } from '../Types/EngineTypes'
import type { market, updatedAsksBids } from '../Types/types'

export default async function EngToWS(changesCount: number, updatedAsks: updatedAsksBids, updatedBids: updatedAsksBids, asset: market) {
  console.log("sending to ws")

  const update = JSON.stringify({
    "data": {
      "asks": Object.entries(updatedAsks),
      "bids": Object.entries(updatedBids)
    },
    "stream": `depth.${asset}`,
    "lastUpdatedId": changesCount
  })
  // const updatedBid = 
  // {
  //   "100": 3,
  //   "101": 7
  // }
  // const a = {
  //   "data":
  //   {
  //     "asks": [
  //       ["72", "0"],
  //       ["74", "9"],
  //       ["89", "700"]
  //     ],
  //     "bids": [
  //       ["17", "12"]
  //     ]
  //   },
  //   "stream": "depth.BTC",
  //   "lastupdatedId": changesCount
  // }
  const ToWS = await streamClient.xAdd(engToWS, '*', { update })
  console.log(ToWS)
}