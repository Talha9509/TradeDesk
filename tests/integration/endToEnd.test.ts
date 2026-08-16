import { describe, it, expect, beforeEach } from 'bun:test'
import { CreateOrder } from '../../engine/src/Options/CreateOrder'
import { CancelOrder } from '../../engine/src/Options/CancelOrder'
import { GetBalance } from '../../engine/src/Options/GetBalance'
import { GetDepth } from '../../engine/src/Options/GetDepth'
import { GetOrder } from '../../engine/src/Options/GetOrder'
import { resetState, seedBalance, getBalance, createOrderPayload } from '../setup'

describe('End-to-End Trading Flows', () => {
  beforeEach(() => resetState())

  it('should complete full buy order lifecycle', () => {
    seedBalance(1, { USD: 10000, SOL: 0 })
    seedBalance(2, { SOL: 100 })

    // Place sell order
    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    // Check initial depth
    let depth = GetDepth({ asset: 'SOL' })
    expect(depth.asks).toHaveLength(1)

    // Place matching buy order
    const buyResult = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    // Verify order filled
    expect(buyResult.order.status).toBe('Filled')
    expect(buyResult.order.filledQty).toBe(5)

    // Verify balances updated
    const buyer1Balance = GetBalance(1)
    const seller2Balance = GetBalance(2)

    expect(buyer1Balance.usd?.available).toBeLessThan(10000)
    expect(buyer1Balance.sol?.available).toBe(5)
    expect(seller2Balance.usd?.available).toBeGreaterThan(0)
    expect(seller2Balance.sol?.available).toBe(95)
  })

  it('should complete full sell order lifecycle', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    // Place buy order
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    // Place matching sell order
    const sellResult = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)

    // Verify order filled
    expect(sellResult.order.status).toBe('Filled')
    expect(sellResult.order.filledQty).toBe(5)

    // Verify fills recorded
    expect(sellResult.fills).toHaveLength(1)
  })

  it('should handle complex multi-level orderbook with price priority', () => {
    seedBalance(1, { USD: 50000, SOL: 0 })
    seedBalance(2, { SOL: 100 })
    seedBalance(3, { SOL: 100 })
    seedBalance(4, { SOL: 100 })

    // Create asks at different prices
    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 10 }), 2)
    CreateOrder(createOrderPayload({ side: 'sell', price: 105, quantity: 10 }), 3)
    CreateOrder(createOrderPayload({ side: 'sell', price: 110, quantity: 10 }), 4)

    // Check depth
    let depth = GetDepth({ asset: 'SOL' })
    expect(depth.asks).toHaveLength(3)
    expect(depth.asks[0].price).toBe(100)

    // Buy exactly matching available quantity to clear all levels
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 115, quantity: 30 }), 1)

    expect(buy.order.status).toBe('Filled')
    expect(buy.order.filledQty).toBe(30)
    expect(buy.fills).toHaveLength(3) // Matched all 3 sellers

    // Verify fills happened at best prices
    expect(buy.fills[0].price).toBe(100)
    expect(buy.fills[1].price).toBe(105)
    expect(buy.fills[2].price).toBe(110)

    // Verify depth cleared
    depth = GetDepth({ asset: 'SOL' })
    expect(depth.asks).toHaveLength(0)
  })

  it('should handle partial fill and order resting on book', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    // Place smaller sell order
    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 3 }), 2)

    // Place larger buy order
    const buy = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 10 }), 1)

    expect(buy.order.status).toBe('Open')
    expect(buy.order.filledQty).toBe(3)

    // Verify order is on book
    const depth = GetDepth({ asset: 'SOL' })
    expect(depth.bids).toHaveLength(1)
    expect(depth.bids[0].totalQty).toBe(7) // Remaining unfilled qty
  })

  it('should handle multiple concurrent orders from different users', () => {
    seedBalance(1, { USD: 20000 })
    seedBalance(2, { USD: 20000 })
    seedBalance(3, { SOL: 100 })
    seedBalance(4, { SOL: 100 })

    // User 1 and 2 both buy
    const buy1 = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)
    const buy2 = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 2)

    // Check depth shows both
    let depth = GetDepth({ asset: 'SOL' })
    expect(depth.bids).toHaveLength(1)
    expect(depth.bids[0].totalOrders).toBe(2)
    expect(depth.bids[0].totalQty).toBe(10)

    // User 3 and 4 sell
    const sell1 = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 3)
    const sell2 = CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 4)

    // Both should fill
    expect(sell1.order.status).toBe('Filled')
    expect(sell2.order.status).toBe('Filled')

    depth = GetDepth({ asset: 'SOL' })
    expect(depth.bids).toHaveLength(0)
    expect(depth.asks).toHaveLength(0)
  })

  it('should maintain balance integrity across multiple operations', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { SOL: 100 })

    const initialBalance1 = GetBalance(1)
    const initialBalance2 = GetBalance(2)

    // Operation 1: Buy
    CreateOrder(createOrderPayload({ side: 'sell', price: 100, quantity: 5 }), 2)
    CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const afterBuyBalance1 = GetBalance(1)
    const afterBuyBalance2 = GetBalance(2)

    // No USD/asset creation/destruction
    expect(
      (initialBalance1.usd?.available || 0) +
      (initialBalance1.usd?.locked || 0) +
      (afterBuyBalance2.usd?.available || 0) +
      (afterBuyBalance2.usd?.locked || 0)
    ).toBe(
      (afterBuyBalance1.usd?.available || 0) +
      (afterBuyBalance1.usd?.locked || 0) +
      (initialBalance2.usd?.available || 0) +
      (initialBalance2.usd?.locked || 0)
    )
  })

  it('should handle market orders across multiple assets', () => {
    seedBalance(1, { USD: 100000 })
    seedBalance(2, { SOL: 100, BTC: 50, ETH: 200 })

    // Place sells on all assets
    CreateOrder(createOrderPayload({ stockName: 'SOL', side: 'sell', price: 100, quantity: 10 }), 2)
    CreateOrder(createOrderPayload({ stockName: 'BTC', side: 'sell', price: 50000, quantity: 2 }), 2)
    CreateOrder(createOrderPayload({ stockName: 'ETH', side: 'sell', price: 2000, quantity: 10 }), 2)

    // Market buy on all assets
    const solBuy = CreateOrder(createOrderPayload({ stockName: 'SOL', side: 'buy', type: 'market', price: null, quantity: 10 }), 1)
    const btcBuy = CreateOrder(createOrderPayload({ stockName: 'BTC', side: 'buy', type: 'market', price: null, quantity: 1 }), 1)
    const ethBuy = CreateOrder(createOrderPayload({ stockName: 'ETH', side: 'buy', type: 'market', price: null, quantity: 10 }), 1)

    expect(solBuy.order.status).toBe('Filled')
    expect(btcBuy.order.status).toBe('Filled')
    expect(ethBuy.order.status).toBe('Filled')

    // Verify all balances updated correctly (seed balance + bought amount)
    const balance1 = GetBalance(1)
    expect(balance1.sol?.available).toBe(100 + 10)
    expect(balance1.btc?.available).toBe(100 + 1)
    expect(balance1.eth?.available).toBe(100 + 10)
  })

  it('should handle GetOrder for specific order', () => {
    seedBalance(1, { USD: 10000 })

    const order = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    const retrieved = GetOrder({ orderId: order.order.orderId }, 1)

    expect(retrieved).toBeDefined()
    expect(retrieved.reqOrder?.orderId).toBe(order.order.orderId)
    expect(retrieved.reqOrder?.status).toBe('Open')
  })

  it('should reject GetOrder for order not owned by user', () => {
    seedBalance(1, { USD: 10000 })
    seedBalance(2, { USD: 10000 })

    const order = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 5 }), 1)

    expect(() => {
      GetOrder({ orderId: order.order.orderId }, 2)
    }).toThrow("The Order does not belong to you")
  })

  it('should handle cancel and verify no balance leak', () => {
    seedBalance(1, { USD: 5000 })

    const order = CreateOrder(createOrderPayload({ side: 'buy', price: 100, quantity: 10 }), 1)

    CancelOrder({ orderId: order.order.orderId }, 1)

    const finalBalance = GetBalance(1)
    expect(finalBalance.usd?.available).toBe(5000)
    expect(finalBalance.usd?.locked).toBe(0)
  })
})
