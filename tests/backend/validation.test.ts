import { describe, it, expect } from 'bun:test'
import { Order } from '../../backend/src/types/types'

describe('Order Validation Schema', () => {
  it('should accept valid limit buy order', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept valid limit sell order', () => {
    const payload = {
      stockName: 'BTC',
      type: 'limit',
      side: 'sell',
      price: 50000,
      quantity: 1,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept valid market buy order with null price', () => {
    const payload = {
      stockName: 'ETH',
      type: 'market',
      side: 'buy',
      price: null,
      quantity: 10,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept valid market sell order', () => {
    const payload = {
      stockName: 'SOL',
      type: 'market',
      side: 'sell',
      price: null,
      quantity: 25,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should reject order with missing stockName', () => {
    const payload = {
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with invalid stockName', () => {
    const payload = {
      stockName: 'DOGE',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with missing type', () => {
    const payload = {
      stockName: 'SOL',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with invalid type', () => {
    const payload = {
      stockName: 'SOL',
      type: 'stop',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with missing side', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with invalid side', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'long',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with missing quantity', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with zero quantity', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 0,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with negative quantity', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: -5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject order with fractional quantity', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 5.5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject limit order with missing price', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject limit order with null price', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: null,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject limit order with zero price', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 0,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject limit order with negative price', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: -100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should accept market buy with positive price (will be ignored)', () => {
    const payload = {
      stockName: 'SOL',
      type: 'market',
      side: 'buy',
      price: 100,
      quantity: 5,
    }

    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should reject empty object', () => {
    const payload = {}

    const result = Order.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('should reject with extra unknown fields', () => {
    const payload = {
      stockName: 'SOL',
      type: 'limit',
      side: 'buy',
      price: 100,
      quantity: 5,
      extraField: 'should be ignored or accepted',
    }

    // Zod by default ignores extra fields
    const result = Order.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should handle all valid stock names', () => {
    const stocks = ['SOL', 'BTC', 'ETH']

    for (const stock of stocks) {
      const payload = {
        stockName: stock,
        type: 'limit',
        side: 'buy',
        price: 100,
        quantity: 5,
      }

      const result = Order.safeParse(payload)
      expect(result.success).toBe(true)
    }
  })

  it('should handle all valid sides', () => {
    const sides = ['buy', 'sell']

    for (const side of sides) {
      const payload = {
        stockName: 'SOL',
        type: 'limit',
        side,
        price: 100,
        quantity: 5,
      }

      const result = Order.safeParse(payload)
      expect(result.success).toBe(true)
    }
  })

  it('should handle all valid types', () => {
    const types = ['limit', 'market']

    for (const type of types) {
      const payload = {
        stockName: 'SOL',
        type,
        side: 'buy',
        price: type === 'limit' ? 100 : null,
        quantity: 5,
      }

      const result = Order.safeParse(payload)
      expect(result.success).toBe(true)
    }
  })
})
