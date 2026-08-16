import { describe, it, expect, beforeEach } from 'bun:test'
import { CreateOrder } from '../../engine/src/Options/CreateOrder'
import { resetState, seedBalance, getBalance, createOrderPayload } from '../setup'

describe('CreateOrder - Happy Paths', () => {
  beforeEach(() => resetState())

  it('should create a limit buy order when no matching asks exist', () => {
    seedBalance(1)
    const payload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })

    const result = CreateOrder(payload, 1)

    expect(result.order.status).toBe('Open')
    expect(result.order.filledQty).toBe(0)
    expect(result.order.side).toBe('buy')
    expect(result.fills).toHaveLength(0)
  })

  it('should create a limit sell order when no matching bids exist', () => {
    seedBalance(1, { SOL: 100 })
    const payload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })

    const result = CreateOrder(payload, 1)

    expect(result.order.status).toBe('Open')
    expect(result.order.filledQty).toBe(0)
    expect(result.order.side).toBe('sell')
  })

  it('should fully match a buy order with existing sell order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    // Place sell order first (automatically placed on book by CreateOrder)
    const sellPayload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })
    CreateOrder(sellPayload, 2)

    // Place matching buy order
    const buyPayload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    const buyResult = CreateOrder(buyPayload, 1)

    expect(buyResult.order.status).toBe('Filled')
    expect(buyResult.order.filledQty).toBe(5)
    expect(buyResult.fills).toHaveLength(1)
    expect(buyResult.fills[0].quantity).toBe(5)
  })

  it('should fully match a sell order with existing buy order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    // Place buy order first
    const buyPayload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    CreateOrder(buyPayload, 1)

    // Place matching sell order
    const sellPayload = createOrderPayload({ side: 'sell', price: 100, quantity: 5 })
    const sellResult = CreateOrder(sellPayload, 2)

    expect(sellResult.order.status).toBe('Filled')
    expect(sellResult.order.filledQty).toBe(5)
    expect(sellResult.fills).toHaveLength(1)
  })

  it('should partial fill a buy order', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    const sellPayload = createOrderPayload({ side: 'sell', price: 100, quantity: 3 })
    CreateOrder(sellPayload, 2)

    const buyPayload = createOrderPayload({ side: 'buy', price: 100, quantity: 5 })
    const buyResult = CreateOrder(buyPayload, 1)

    expect(buyResult.order.status).toBe('Open')
    expect(buyResult.order.filledQty).toBe(3)
    expect(buyResult.fills).toHaveLength(1)
  })

  it('should match across multiple price levels - best price first', () => {
    seedBalance(1, { USD: 20000 })
    seedBalance(2, { SOL: 50 })
    seedBalance(3, { SOL: 50 })

    // Place sells at different prices
    CreateOrder(createOrderPayload({ side: 'sell', price: 98, quantity: 5 }), 2)
    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 3)

    // Buy should match with cheaper price first
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 105, quantity: 10 }), 1)

    expect(buy.order.filledQty).toBe(10)
    expect(buy.fills).toHaveLength(2)
    expect(buy.fills[0].price).toBe(98)
    expect(buy.fills[1].price).toBe(100)
  })

  it('should place market buy order and fill completely', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const market = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    expect(market.order.status).toBe('Filled')
    expect(market.order.filledQty).toBe(5)
  })

  it('should place market sell order and partially fill', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 3 }), 1)

    const market = CreateOrder(createOrderPayload({ side: 'sell', type: 'market', price: null, quantity: 5 }), 2)

    expect(market.order.filledQty).toBe(3)
    expect(market.order.status).toBe('Partially-filled')
  })

  it('should lock balance for limit buy order', () => {
    seedBalance(1, { USD: 10000 })
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const buyerBalance = getBalance(1, 'USD')
    expect(buyerBalance?.locked).toBe(500) // 100 * 5
    expect(buyerBalance?.available).toBe(9500)
  })

  it('should handle market order with liquidity', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const buy = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    expect(buy.order.filledQty).toBeGreaterThan(0)
  })
})

describe('CreateOrder - Edge Cases', () => {
  beforeEach(() => resetState())

  it('should reject order with insufficient USD balance for buy', () => {
    seedBalance(1, { USD: 400 }) // Not enough for 5 * 100
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    expect(() => {
      CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)
    }).toThrow('No balance')
  })

  it('should reject order with insufficient asset balance for sell', () => {
    seedBalance(1, { USD: 10000, SOL: 3 }) // Not enough SOL

    expect(() => {
      CreateOrder(createOrderPayload({ side: 'sell', quantity: 5 }), 1)
    }).toThrow('No balance')
  })

  it('should cancel market buy with no available liquidity', () => {
    seedBalance(1, { USD: 10000 })

    const buy = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    expect(buy.order.status).toBe('Cancelled')
    expect(buy.order.filledQty).toBe(0)
  })

  it('should cancel market sell with no available liquidity', () => {
    seedBalance(1, { SOL: 100 })

    const sell = CreateOrder(createOrderPayload({ side: 'sell', type: 'market', price: null, quantity: 5 }), 1)

    expect(sell.order.status).toBe('Cancelled')
    expect(sell.order.filledQty).toBe(0)
  })

  it('should respect price priority - buy order below ask price does not match', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    // Buy at 95 should not match with sell at 100
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 95, quantity: 5 }), 1)

    expect(buy.order.status).toBe('Open')
    expect(buy.order.filledQty).toBe(0)
  })

  it('should respect price priority - sell order above bid price does not match', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    // Sell at 105 should not match with buy at 100
    const sell = CreateOrder(createOrderPayload({ side: 'sell', price: 105, quantity: 5 }), 2)

    expect(sell.order.status).toBe('Open')
    expect(sell.order.filledQty).toBe(0)
  })

  it('should enforce FIFO at same price level', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })
    seedBalance(3, { SOL: 100 })

    // First sell at 100
    const sell1 = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 3 }), 2)

    // Second sell at 100
    const sell2 = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 3 }), 3)

    // Buy should match with first order (FIFO)
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 6 }), 1)

    expect(buy.fills).toHaveLength(2)
    expect(buy.fills[0].sellOrderId).toBe(sell1.order.orderId)
    expect(buy.fills[1].sellOrderId).toBe(sell2.order.orderId)
  })

  it('should partial fill market order', () => {
    seedBalance(1, { USD: 200 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    const buy = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    expect(buy.order.filledQty).toBeGreaterThan(0)
  })

  it('should correctly calculate limit order with better execution price', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'sell', price: 95, quantity: 5 }), 2)

    // Buy at 100, but match at 95 - should unlock extra USD
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    expect(buy.order.status).toBe('Filled')
    // Locked: 100 * 5 = 500, Paid: 95 * 5 = 475, Return: 25
    const buyerBalance = getBalance(1, 'USD')
    expect(buyerBalance?.available).toBe(10000 - 475) // Paid actual, not limit price
  })

  it('should handle market sell with partial fill status', () => {
    seedBalance(1, { USD: 1000 })
    seedBalance(2, { SOL: 100 })

    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 3 }), 1)

    // Market sell 5 but only 3 available
    const sell = CreateOrder(createOrderPayload({ side: 'sell', type: 'market', price: null, quantity: 5 }), 2)

    expect(sell.order.status).toBe('Partially-filled')
    expect(sell.order.filledQty).toBe(3)
  })

  it('should cancel market order and return proper status', () => {
    seedBalance(1, { USD: 10000 })

    const buy = CreateOrder(createOrderPayload({ side: 'buy', type: 'market', price: null, quantity: 5 }), 1)

    expect(buy.order.status).toBe('Cancelled')
  })
})
