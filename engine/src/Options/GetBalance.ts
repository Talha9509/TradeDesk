import getOrCreateBalance from "../utils/getOrCreateBalance"

export const GetBalance = (userId: number) => {
  // Algorithm:
  // 1. get balance by func get or create balance
  const balance = getOrCreateBalance(userId)
  const usd = balance?.get('USD')
  const btc = balance?.get('BTC')
  const eth = balance?.get('ETH')
  const sol = balance?.get('SOL')
  return { usd, btc, eth, sol }
}