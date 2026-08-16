import { describe, it, expect, beforeEach } from 'bun:test'
import { GetBalance } from '../../engine/src/Options/GetBalance'
import { CreateOrder } from '../../engine/src/Options/CreateOrder'
import { resetState, seedBalance, getBalance, createOrderPayload } from '../setup'

describe('GetBalance', () => {
  beforeEach(() => resetState())

  it('should return default balances for new user', () => {
    seedBalance(1)
    const result = GetBalance(1)

    expect(result.usd?.available).toBe(10000)
    expect(result.usd?.locked).toBe(0)
    expect(result.sol?.available).toBe(100)
    expect(result.sol?.locked).toBe(0)
    expect(result.btc?.available).toBe(100)
    expect(result.btc?.locked).toBe(0)
    expect(result.eth?.available).toBe(100)
    expect(result.eth?.locked).toBe(0)
  })

  it('should return custom seeded balances', () => {
    seedBalance(1, { USD: 5000, SOL: 50, BTC: 25, ETH: 75 })
    const result = GetBalance(1)

    expect(result.usd?.available).toBe(5000)
    expect(result.sol?.available).toBe(50)
    expect(result.btc?.available).toBe(25)
    expect(result.eth?.available).toBe(75)
  })

  it('should show locked balance after limit buy order', () => {
    seedBalance(1, { USD: 10000 })
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    CreateOrder(payload, 1)

    const result = GetBalance(1)

    expect(result.usd?.locked).toBe(500) // 100 * 5
    expect(result.usd?.available).toBe(9500)
  })

  it('should show locked balance after limit sell order', () => {
    seedBalance(1, { SOL: 100 })
    const payload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })
    CreateOrder(payload, 1)

    const result = GetBalance(1)

    expect(result.sol?.locked).toBe(5)
    expect(result.sol?.available).toBe(95)
  })

  it('should update balance after order fill', () => {
    seedBalance(1, { USD: 10000, SOL: 0 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const result = GetBalance(1)

    expect(result.usd?.available).toBeLessThan(10000)
    expect(result.sol?.available).toBe(5)
  })

  it('should maintain independent balances for different users', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { USD: 20000 })
    seedBalance(3, { USD: 5000 })

    const result1 = GetBalance(1)
    const result2 = GetBalance(2)
    const result3 = GetBalance(3)

    expect(result1.usd?.available).toBe(10000)
    expect(result2.usd?.available).toBe(20000)
    expect(result3.usd?.available).toBe(5000)
  })

  it('should show correct balance after partial fill', () => {
    seedBalance(1, { USD: 10000, SOL: 0 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 3 }), 2)
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const result = GetBalance(1)

    expect(result.usd?.available).toBeLessThan(10000)
    expect(result.sol?.available).toBe(3)
  })

  it('should show correct locked balance after market order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)
    CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    const result = GetBalance(1)

    expect(result.usd?.available).toBeLessThan(10000)
    expect(result.sol?.available).toBeGreaterThan(0)
  })
})
