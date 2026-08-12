import { getOrCreateBalance, OrderBook, Orders, Fills, restOrderOnBook, type OrderType } from '../Types/types'

export const CreateOrder = (data: OrderType, userId: number) => {
  // 2. check balance of user if he has money for req quantity, stock for selling
  const asset =  data.stockName
  const balance = getOrCreateBalance(userId!)
  console.log(`Step 2.1: Balance ${JSON.stringify(balance)} `)

  const available = data.side == "buy" ? balance.USD.available : balance[asset].available
  console.log(`Step 2.2: available ${available}`)
  const reqAmount = data.side == "buy" ? (data.price * data.quantity) : data.quantity
  console.log(`Step 2.3: req amount ${reqAmount}`)
  if (available < reqAmount) throw Error("No balance")

  // 3. reduce the balance or lock in case of limit
  if (data.side == "buy") {
    balance.USD.locked += reqAmount
    balance.USD.available -= reqAmount
    console.log(`Step 3.1.1: Balance ${JSON.stringify(balance)} `)
  } else {
    balance[asset].locked += reqAmount
    balance[asset].available -= reqAmount
    console.log(`Step 3.1.2: Balance ${JSON.stringify(balance)} `)
  }
  // console.log(`Step 3.1.3: USD/Assets locked`)

  const nextOrderId = Orders.length + 1   

  const incomingOrder = {
    id: nextOrderId,
    userId: userId,
    market: asset,
    price: data.price,
    quantity: data.quantity,
    type: data.type,
    side: data.side,
    filledQty: 0,
    status: "Open",
    createdAt: new Date().toISOString()
  }
  console.log(`Step 3.2: Incoming Order ${JSON.stringify(incomingOrder)}`)
  Orders.push(incomingOrder)
  console.log(`Step 3.3: Orders ${JSON.stringify(Orders)}`)

  // Matching algorithm:
  // if buy then check asks
  // if sell then check bids
  // if kept on limit to buy on 140, then if lesser than 140 also it should match, same for selling
  const oppSide = data.side == "buy" ? "asks" : "bids"
  const oppBook = OrderBook[asset][oppSide]
  console.log(`Step 4.1: opp book ${JSON.stringify(oppBook)}`)

  const sortedPrices = Object.keys(oppBook).map(Number).sort((a, b) => incomingOrder.side == "buy" ? a-b : b-a)
  console.log(`Step 4.2: sorted prices ${sortedPrices}`)

  const orderTakerFills = []
  for(const levelPrice of sortedPrices){
    if(incomingOrder.filledQty >= incomingOrder.quantity) break

    const crosses = incomingOrder.type == "market" || 
    (incomingOrder.side == "buy" && levelPrice <= incomingOrder.price) || 
    (incomingOrder.side == "sell" && levelPrice >= incomingOrder.price)
    if(!crosses) break

    const level = oppBook[levelPrice]
    console.log(`Step 4.3: level ${JSON.stringify(level)}`)

    while(level.Orders != undefined && level.Orders.length > 0 && incomingOrder.filledQty < incomingOrder.quantity){
      const makerOrder = level.Orders[0]
      console.log(`Step 4.4: maker Order ${JSON.stringify(makerOrder)}`)

      const incomingRemaining = incomingOrder.quantity - incomingOrder.filledQty
      const makerRemaining = makerOrder.quantity - makerOrder.filledQty
      const matchedQty = Math.min(incomingRemaining, makerRemaining)
      console.log(`Step 4.5: matchedQty ${matchedQty}`)

      incomingOrder.filledQty += matchedQty
      makerOrder.filledQty += matchedQty
      console.log(`Step 4.6: incomingorder: ${JSON.stringify(incomingOrder)}, makerorder: ${JSON.stringify(makerOrder)}`)
      if(incomingOrder.filledQty === incomingOrder.quantity) incomingOrder.status = "Filled"
      if(makerOrder.filledQty === makerOrder.quantity) makerOrder.status = "Filled"

      const now = new Date().toISOString()
      const TakerFill = { quantity: matchedQty, side: incomingOrder.side, type: "taker", userId: incomingOrder.userId, price: levelPrice, asset: asset, orderId: incomingOrder.id, createdAt: now }
      Fills.push(TakerFill)
      orderTakerFills.push(TakerFill)
      Fills.push({ quantity: matchedQty, side: makerOrder.side, type: "maker", userId: makerOrder.userId, price: levelPrice, asset: asset, orderId: makerOrder.id, createdAt: now })
      console.log(`Step 4.7: fills ${JSON.stringify(Fills)}`)

      const buyerId = data.side == "buy" ? incomingOrder.userId : makerOrder.userId
      const sellerId = data.side == "buy" ? makerOrder.userId : incomingOrder.userId
      const buyerBalance = getOrCreateBalance(buyerId)
      const sellerBalance = getOrCreateBalance(sellerId)
      console.log(`Step 4.8: buyerbalance ${JSON.stringify(buyerBalance)}, sellerbalance ${JSON.stringify(sellerBalance)}`)
      const tradedUSD = levelPrice * matchedQty
      
      // if user gets the asset in less prize
      if(tradedUSD < buyerBalance.USD.locked){
        const diff = buyerBalance.USD.locked - tradedUSD
        buyerBalance.USD.available += diff
        buyerBalance.USD.locked -= diff
        console.log(`Step 4.8.1: buyer balance ${JSON.stringify(buyerBalance)}`)
      }
      buyerBalance.USD.locked -= tradedUSD
      buyerBalance[asset].available += matchedQty
      sellerBalance[asset].locked -= matchedQty
      sellerBalance.USD.available += tradedUSD
      console.log(`Step 4.9: after exchange, buyerbalance ${JSON.stringify(buyerBalance)}, sellerbalance ${JSON.stringify(sellerBalance)}`)

      level.totalQty -= matchedQty
      console.log(`Step 4.10: level ${JSON.stringify(level)}`)
      if(makerOrder.filledQty == makerOrder.quantity) level.Orders.shift()
      }
    
    if(level.Orders.length == 0) delete oppBook[levelPrice]
    console.log(`Step 4.11: level ${JSON.stringify(level)}`)
  }
  
  if(incomingOrder.filledQty < incomingOrder.quantity && incomingOrder.type == "limit"){
    restOrderOnBook(incomingOrder)
    console.log(`Step 4.12: rest on orderbook`)
  }

  console.log(`Step last: Balance ${JSON.stringify(balance)} `)
  return { order: incomingOrder, fills: orderTakerFills }

  // 4. 
    // i. for market:
      // 1. match from the orderbook
      // 2. update the orderbook
      //  move usd from buyer to seller and asset from seller to buyer
      // 3. update order of his and other user who is buy/sell
      // 4. update fill of his and other user
    // ii. for limit:
      // 1. match the orderbook
      // 2. if not then sit on orderbook and update
      // 3. if any order matches then update order and fill
}