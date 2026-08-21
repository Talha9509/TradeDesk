
type options = `depth.SOL` | `depth.BTC` | `depth.ETH`

export type update = {
  stream: options,
  data: string,
  lastUpdatedId: number
}

export type data = {
  method: "SUBSCRIBE" | "UNSUBSCRIBE",
  params: [options]
}