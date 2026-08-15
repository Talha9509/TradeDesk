import { OrderBook } from '../Types/types'
import { Orders, Fills, type OrderRecord, type Fill } from '../Types/OrderFillsType'
import getOrCreateBalance from "../utils/getOrCreateBalance";

export const CancelOrder = (data: Record<string | number, any>, userId: number) => {
  // Algorithm:
  // 0. find the order using orderId
  const orderId = data.orderId
  const reqOrder = Orders.get(orderId)
  // const reqOrder = Orders.find((order) => order.id == orderId)
  console.log(`0. Required order: ${JSON.stringify(reqOrder)}`)
  
  // 1. the order must be limit order only & 2. the status of order must be open
  const MarketOrOpen = reqOrder?.type == 'market' && reqOrder?.status != 'Open'
  console.log(`1. market or open: ${MarketOrOpen}`)
  if(MarketOrOpen) throw Error("Can't Cancel the Order")

  // 3. update orderbook
  const asksOrbids = reqOrder?.side == 'buy' ? 'bids' : 'asks'
  const asset = reqOrder?.market
  const price = reqOrder?.price
  const market = OrderBook.get(asset!)
  console.log(`3.1: market: ${JSON.stringify(market)}`)
  const BookSide = market?.[asksOrbids]
  const priceLevel = BookSide?.get(price!)
  if(!priceLevel || !reqOrder) throw Error("Can't Cancel the Order")
    const remainQty = reqOrder?.quantity - reqOrder?.filledQty
  priceLevel.totalQty = priceLevel.totalQty - remainQty
  priceLevel.orders.filter((order) => order.orderId != orderId)
  console.log(`3.2: priceLevel: ${JSON.stringify(priceLevel)}`)
  
  // 4. 
  //   i. if filledQty = 0 return locked amount
  //   ii. if filledQty != 0 return traded amount - locked amount (for buy, if traded amount/asset <             
  //       given price, then return that USD as well to available)
  const balance = getOrCreateBalance(userId)
  const usd = balance?.get("USD")!;
  const assetBalance = balance?.get(asset!)!;
  let filled: "Cancelled" | "Partially-filled";
  if(reqOrder.filledQty == 0){
    filled = "Cancelled"
    if(reqOrder?.side == 'buy'){
      usd.locked = usd.locked - (price! * reqOrder.quantity)
      usd.available = usd.available + (price! * reqOrder.quantity)
      console.log(`4.1: usd locked: ${JSON.stringify(usd.locked)}, usd available: ${JSON.stringify(usd.available)}`)
    } else {
      assetBalance.locked = assetBalance.locked - reqOrder.quantity
      assetBalance.available = assetBalance.available + reqOrder.quantity
      console.log(`4.1: asset locked: ${JSON.stringify(assetBalance.locked)}, asset available: ${JSON.stringify(assetBalance.available)}`)
    }
  } else {
    filled = "Partially-filled"
    // partially filled
    if(reqOrder?.side == 'buy'){
      const fills = Fills.filter((fill) => fill.buyOrderId != orderId)
      console.log(`4.2.1 fills: ${fills}`)
      let actualPricePaid: number = 0;
      for(const fill of fills){
        actualPricePaid = actualPricePaid + (fill.quantity * fill.price)
      }
      console.log(`4.2.2 actualPricePaid: ${actualPricePaid}`)
      const totalLocked = price! * reqOrder.quantity
      console.log(`4.2.3 totalLocked: ${totalLocked}`)
      // 100 * 10 = 1000
      const remainingValue = price! * remainQty
      console.log(`4.2.4 remainingValue: ${remainingValue}`)
      // 100 * 6 = 600
      const boughtValue = totalLocked - remainingValue
      console.log(`4.2.5 boughtValue: ${boughtValue}`)
      // 1000 - 600 = 400
      const diff = boughtValue - actualPricePaid
      console.log(`4.2.6 diff: ${diff}`)
      // 400 - 360 = 40
      usd.locked = usd.locked - remainingValue - diff
      usd.available = usd.available + remainingValue + diff
      console.log(`4.2.7: usd locked: ${JSON.stringify(usd.locked)}, usd available: ${JSON.stringify(usd.available)}`)
    } else {
      assetBalance.locked = assetBalance.locked - remainQty 
      assetBalance.available = assetBalance.available + remainQty 
      console.log(`4.2: asset locked: ${JSON.stringify(assetBalance.locked)}, asset available: ${JSON.stringify(assetBalance.available)}`)
    }
  }

  // 5. then update order in orders with status cancelled/partially-filled and show filledQty
  reqOrder.status = filled
  console.log(`5: ${JSON.stringify(reqOrder)}`)
  
  // 6. update balance of user
  return { order: reqOrder }
}