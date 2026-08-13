import { Balances, type balanceMarket, type availLocked } from '../Types/types'

// creates a balance with some stock the first time we see a userId, returns it either way
export default function getOrCreateBalance(userId: number) {
  let balance = Balances.get(userId)
  if (!balance) {
    balance = new Map<balanceMarket, availLocked>([
      ["USD", { available: 1000, locked: 0 }],
      ["SOL", { available: 100, locked: 0 }],
      ["BTC", { available: 100, locked: 0 }],
      ["ETH", { available: 100, locked: 0 }]
    ])
    Balances.set(userId, balance)
  }
  return Balances.get(userId)
}