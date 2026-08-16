import { describe, it, expect, beforeEach } from 'bun:test'
import { CancelOrder } from '../../engine/src/Options/CancelOrder'
import { CreateOrder } from '../../engine/src/Options/CreateOrder'
import { resetState, seedBalance, getBalance, createOrderPayload } from '../setup'

describe('CancelOrder - Happy Paths', () => {
  beforeEach(() => resetState())

  it('should cancel an unfilled limit buy order and return USD', () => {
    seedBalance(1, { USD: 10000 })
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    const orderResult = CreateOrder(payload, 1)

    const orderId = orderResult.order.orderId
    const result = CancelOrder({ orderId }, 1)

    expect(result.order.status).toBe('Cancelled')
    expect(result.order.filledQty).toBe(0)
    const balance = getBalance(1, 'USD')
    expect(balance?.available).toBe(10000)
    expect(balance?.locked).toBe(0)
  })

  it('should cancel an unfilled limit sell order and return asset', () => {
    seedBalance(1, { SOL: 100 })
    const payload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })
    const orderResult = CreateOrder(payload, 1)

    const orderId = orderResult.order.orderId
    const result = CancelOrder({ orderId }, 1)

    expect(result.order.status).toBe('Cancelled')
    const assetBalance = getBalance(1, 'SOL')
    expect(assetBalance?.available).toBe(100)
    expect(assetBalance?.locked).toBe(0)
  })

  it('should cancel a partially filled limit order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    const sell = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 3 }), 2)
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    expect(buy.order.filledQty).toBe(3)

    const result = CancelOrder({ orderId: buy.order.orderId }, 1)

    expect(result.order.status).toBe('Partially-filled')
    expect(result.order.filledQty).toBe(3)
  })

  it('should cancel a partially filled sell order and unlock remaining asset', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 3 }), 1)

    const sell = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const orderId = sell.order.orderId
    const result = CancelOrder({ orderId }, 2)

    expect(result.order.status).toBe('Partially-filled')
    expect(result.order.filledQty).toBe(3)
    const assetBalance = getBalance(2, 'SOL')
    expect(assetBalance?.locked).toBe(0)
    expect(assetBalance?.available).toBe(100 - 3) // Sold 3, rest returned
  })
})

describe('CancelOrder - Edge Cases', () => {
  beforeEach(() => resetState())

  it('should throw error when canceling order of different user', () => {
    seedBalance(1, { USD: 10000 })
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    const orderResult = CreateOrder(payload, 1)

    expect(() => {
      CancelOrder({ orderId: orderResult.order.orderId }, 2)
    }).toThrow("Can't Cancel the Order")
  })

  it('should throw error when canceling non-existent order', () => {
    expect(() => {
      CancelOrder({ orderId: 'fake-uuid' }, 1)
    }).toThrow("Can't Cancel the Order")
  })

  it('should throw error when canceling a fully filled order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    // Order is filled, attempt to cancel
    expect(() => {
      CancelOrder({ orderId: buy.order.orderId }, 1)
    }).toThrow("Can't Cancel the Order")
  })

  it('should throw error when canceling a market order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const market = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    // Market orders can't be cancelled
    expect(() => {
      CancelOrder({ orderId: market.order.orderId }, 1)
    }).toThrow("Can't Cancel the Order")
  })

  it('should correctly calculate returned USD for partially filled buy with better execution', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 95, quantity: 3 }), 2)

    // Buy at 100, match at 95
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const result = CancelOrder({ orderId: buy.order.orderId }, 1)

    expect(result.order.filledQty).toBe(3)
    // Locked: 100 * 5 = 500
    // Spent: 95 * 3 = 285
    // Remaining unfilled: 100 * 2 = 200
    // Diff between locked and spent: 500 - 285 = 215
    // Should unlock: 200 (remaining) + 15 (price diff)
    const balance = getBalance(1, 'USD')
    expect(balance?.available).toBeGreaterThan(10000 - 300)
  })

  it('should handle cancellation of limit order with zero fills', () => {
    seedBalance(1, { USD: 10000 })
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 10 })
    const orderResult = CreateOrder(payload, 1)

    const result = CancelOrder({ orderId: orderResult.order.orderId }, 1)

    expect(result.order.filledQty).toBe(0)
    expect(result.order.status).toBe('Cancelled')
    const balance = getBalance(1, 'USD')
    expect(balance?.available).toBe(10000)
    expect(balance?.locked).toBe(0)
  })
})
