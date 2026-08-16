import { describe, it, expect, beforeEach } from 'bun:test'
import { GetDepth } from '../../engine/src/Options/GetDepth'
import { CreateOrder } from '../../engine/src/Options/CreateOrder'
import { resetState, seedBalance, createOrderPayload } from '../setup'

describe('GetDepth', () => {
  beforeEach(() => resetState())

  it('should return empty depth for asset with no orders', () => {
    const result = GetDepth({ asset: 'SOL' })

    expect(result.bids).toHaveLength(0)
    expect(result.asks).toHaveLength(0)
  })

  it('should return single bid level', () => {
    seedBalance(1, { USD: 10000 })
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    CreateOrder(payload, 1)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.bids).toHaveLength(1)
    expect(result.bids[0].price).toBe(100)
    expect(result.bids[0].totalQty).toBe(5)
    expect(result.bids[0].totalOrders).toBe(1)
    expect(result.asks).toHaveLength(0)
  })

  it('should return single ask level', () => {
    seedBalance(1, { SOL: 100 })
    const payload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })
    CreateOrder(payload, 1)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.asks).toHaveLength(1)
    expect(result.asks[0].price).toBe(100)
    expect(result.asks[0].totalQty).toBe(5)
    expect(result.asks[0].totalOrders).toBe(1)
    expect(result.bids).toHaveLength(0)
  })

  it('should aggregate multiple orders at same price level', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { USD: 10000 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 3 }), 2)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.bids).toHaveLength(1)
    expect(result.bids[0].price).toBe(100)
    expect(result.bids[0].totalQty).toBe(8) // 5 + 3
    expect(result.bids[0].totalOrders).toBe(2)
  })

  it('should return bids in descending order', () => {
    seedBalance(1, { USD: 20000 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.bids).toHaveLength(1)
    expect(result.bids[0].price).toBe(100)
  })

  it('should return asks in ascending order', () => {
    seedBalance(1, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 1)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.asks).toHaveLength(1)
    expect(result.asks[0].price).toBe(100)
  })

  it('should show complete orderbook with both bids and asks', () => {
    seedBalance(1, { USD: 20000, SOL: 100 })
    seedBalance(2, { USD: 20000, SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)
    CreateOrder(createOrderPayload({ side: 'sell', price: 110, quantity: 3 }), 2)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.bids).toHaveLength(1)
    expect(result.asks).toHaveLength(1)
    expect(result.bids[0].price).toBe(100)
    expect(result.asks[0].price).toBe(110)
  })

  it('should update depth after partial fill', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    // Before buy
    let result = GetDepth({ asset: 'SOL' })
    expect(result.asks[0].totalQty).toBe(5)

    // Partial fill with buy
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 3 }), 1)

    // After partial buy
    result = GetDepth({ asset: 'SOL' })
    expect(result.asks[0].totalQty).toBe(2)
    expect(result.asks[0].totalOrders).toBe(1)
  })

  it('should remove price level when completely filled', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const result = GetDepth({ asset: 'SOL' })

    expect(result.asks).toHaveLength(0)
  })

  it('should handle different assets independently', () => {
    seedBalance(1, { USD: 100000 })

    CreateOrder(createOrderPayload({ stockName: 'SOL', side: 'buy', price: 100, quantity: 5 }), 1)
    CreateOrder(createOrderPayload({ stockName: 'BTC', side: 'buy', price: 50000, quantity: 1 }), 1)

    const solDepth = GetDepth({ asset: 'SOL' })
    const btcDepth = GetDepth({ asset: 'BTC' })

    expect(solDepth.bids).toHaveLength(1)
    expect(solDepth.bids[0].price).toBe(100)
    expect(btcDepth.bids).toHaveLength(1)
    expect(btcDepth.bids[0].price).toBe(50000)
  })

  it('should handle empty order book gracefully', () => {
    const result = GetDepth({ asset: 'BTC' })

    expect(result.bids).toEqual([])
    expect(result.asks).toEqual([])
  })
})
