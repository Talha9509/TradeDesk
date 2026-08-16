import { OrderBook } from '../Types/types'
import { Orders, Fills, type OrderRecord, type Fill } from '../Types/OrderFillsType'
import getOrCreateBalance from "../utils/getOrCreateBalance";
import restOrderOnBook from '../utils/restOrderonBook'

export const CreateOrder = (data: Record<string | number, any>, userId: number) => {
  // 2. check balance of user if he has money for req quantity, stock for selling
  const asset =  data.stockName
  const balance = getOrCreateBalance(userId!)
  console.log(`Step 2.1: Balance`)
  console.log(balance)

  const available = data.side == "buy" ? balance?.get('USD')?.available : balance?.get(asset)?.available
  console.log(`Step 2.2: available ${available}`)
  const reqAmount = data.side == "buy" ? (data.price * data.quantity) : data.quantity
  console.log(`Step 2.3: req amount ${reqAmount}`)
  if (available! < reqAmount) throw Error("No balance")

  const usd = balance?.get("USD")!;
  const assetBalance = balance?.get(asset)!;

  // 3. reduce the balance or lock in case of limit
  if(data.type == 'limit'){
    if (data.side == "buy") {
      usd.locked += reqAmount
      usd.available -= reqAmount
      console.log(`Step 3.1.1: Balance`)
      console.log(balance)
    } else {
      assetBalance.locked += reqAmount
      assetBalance.available -= reqAmount
      console.log(`Step 3.1.2: Balance`)
      console.log(balance)
    }
  }
  // console.log(`Step 3.1.3: USD/Assets locked`)

  const incomingOrder: OrderRecord = {
    orderId: crypto.randomUUID()  ,
    userId: userId,
    market: asset,
    price: data.price,
    quantity: data.quantity,
    type: data.type,
    side: data.side,
    fills: [],
    filledQty: 0,
    status: "Open",
    createdAt: new Date().toISOString()
  }
  console.log(`Step 3.2: Incoming Order ${JSON.stringify(incomingOrder)}`)
  Orders.set(incomingOrder.orderId, incomingOrder)
  console.log(`Step 3.3: Orders ${JSON.stringify(Orders)}`)

  // Matching algorithm:
  // if buy then check asks
  // if sell then check bids
  // if kept on limit to buy on 140, then if lesser than 140 also it should match, same for selling
  const oppSide = data.side == "buy" ? "asks" : "bids"
  const AssetInOrderBook = OrderBook.get(asset)
    if (!AssetInOrderBook) {
    throw new Error(`Asset not in orderbook: ${AssetInOrderBook}`)
  }
  const oppBook = AssetInOrderBook[oppSide]
  // const oppBook = OrderBook[asset][oppSide]

  console.log(`Step 4.1: opp book`)
  console.log(oppBook)

  const sortedPrices = [...oppBook.keys()].sort((a, b) => incomingOrder.side == "buy" ? a - b : b - a)
  console.log(`Step 4.2: sorted prices ${sortedPrices}`)
  if(sortedPrices.length == 0 && incomingOrder.type == 'market') incomingOrder.status = "Cancelled";

  const orderFill = []
  for(const levelPrice of sortedPrices){
    if(incomingOrder.filledQty >= incomingOrder.quantity) break

    const crosses = incomingOrder.type == "market" || 
    (incomingOrder.type == 'limit' && incomingOrder.side == "buy" && levelPrice <= incomingOrder.price) || 
    (incomingOrder.side == "sell" && levelPrice >= incomingOrder.price)
    if(!crosses) break

    const level = oppBook.get(levelPrice)
    console.log(`Step 4.3: level ${JSON.stringify(level)}`)

    while(level?.orders != undefined && level.orders.length > 0 && incomingOrder.filledQty < incomingOrder.quantity){
      const makerOrder = level.orders[0]
      if(incomingOrder.userId == makerOrder?.userId || !makerOrder) {
        console.log("can't trade with yourself")
        continue;
      }
      console.log(`Step 4.4: maker Order ${JSON.stringify(makerOrder)}`)

      const incomingRemaining = incomingOrder.quantity - incomingOrder.filledQty
      const makerRemaining = makerOrder.quantity - makerOrder.filledQty
      const marketBuyLessUSD = (incomingOrder.side == 'buy' && incomingOrder.type == 'market') ? Math.floor(usd.available / makerOrder.price) : makerRemaining
      const matchedQty = Math.min(incomingRemaining, makerRemaining, marketBuyLessUSD)
      console.log(`Step 4.5: matchedQty ${matchedQty}`)

      const reqAmountt = matchedQty * makerOrder.price
      if (incomingOrder.type == 'market') {
        if (matchedQty == 0 || (incomingOrder.side == 'buy' && reqAmountt > usd?.available!)) {
          incomingOrder.status = incomingOrder.filledQty > 0 ? "Partially-filled" : 'Cancelled';
          return { order: incomingOrder, fills: orderFill, message: incomingOrder.filledQty > 0 && 'Not enough balance, so order is partially filled' }
        }
      }

      incomingOrder.filledQty += matchedQty
      makerOrder.filledQty += matchedQty
      console.log(`Step 4.6: incomingorder: ${JSON.stringify(incomingOrder)}, makerorder: ${JSON.stringify(makerOrder)}`)
      if(incomingOrder.filledQty === incomingOrder.quantity) incomingOrder.status = "Filled"
      if(makerOrder.filledQty === makerOrder.quantity) makerOrder.status = "Filled"

      const now = new Date().toISOString()
      const Fill: Fill = { 
        quantity: matchedQty, 
        side: incomingOrder.side, 
        userId: incomingOrder.userId, 
        price: levelPrice, 
        asset: asset, 
        buyOrderId: incomingOrder.side == 'buy' ? incomingOrder.orderId : makerOrder.orderId, 
        sellOrderId: incomingOrder.side == 'buy' ? makerOrder.orderId : incomingOrder.orderId, 
        fillId: crypto.randomUUID(), 
        createdAt: now 
      }
      Fills.push(Fill)
      incomingOrder.fills.push(Fill)
      makerOrder.fills.push(Fill)
      orderFill.push(Fill)
      // Fills.push({ quantity: matchedQty, side: makerOrder.side, type: "maker", userId: makerOrder.userId, price: levelPrice, asset: asset, orderId: makerOrder.id, createdAt: now })
      console.log(`Step 4.7: fills ${JSON.stringify(Fills)}`)

      const buyerId = data.side == "buy" ? incomingOrder.userId : makerOrder.userId
      const sellerId = data.side == "buy" ? makerOrder.userId : incomingOrder.userId
      const buyerBalance = getOrCreateBalance(buyerId)
      const sellerBalance = getOrCreateBalance(sellerId)
      console.log(`Step 4.8: buyerbalance, sellerbalance`)
      console.log(buyerBalance)
      console.log(sellerBalance)
      const tradedUSD = levelPrice * matchedQty
      
      const buyerUSD = buyerBalance?.get("USD")!;
      const buyerAssetBalance = buyerBalance?.get(asset)!;
      const sellerUSD = sellerBalance?.get("USD")!;
      const sellerAssetBalance = sellerBalance?.get(asset)!;

      if (incomingOrder.type == 'market') {
        if(incomingOrder.side == 'buy'){
          buyerUSD.available = buyerUSD?.available! - reqAmountt
          buyerAssetBalance.available = buyerAssetBalance.available + matchedQty
          sellerUSD.available = sellerUSD.available + reqAmountt
          sellerAssetBalance.available = sellerAssetBalance.available - matchedQty
        } else {
          sellerAssetBalance.available = sellerAssetBalance.available - matchedQty
          sellerUSD.available = sellerUSD.available + reqAmountt
          buyerAssetBalance.available = buyerAssetBalance.available + matchedQty
          buyerUSD.available = buyerUSD.available - reqAmountt
        }
        console.log(`Step 4.9: after exchange, buyerbalance, sellerbalance`)
        console.log(buyerBalance)
        console.log(sellerBalance)
      } else { 
        // if user gets the asset in less prize
        if(tradedUSD < buyerUSD.locked){
          const diff = buyerUSD.locked - tradedUSD
          buyerUSD.available += diff
          buyerUSD.locked -= diff
          console.log(`Step 4.8.1: buyer balance ${JSON.stringify(buyerBalance)}`)
        }
        buyerUSD.locked -= tradedUSD
        buyerAssetBalance.available += matchedQty
        sellerAssetBalance.locked -= matchedQty
        sellerUSD.available += tradedUSD
        console.log(`Step 4.9: after exchange, buyerbalance ${JSON.stringify(buyerBalance)}, sellerbalance ${JSON.stringify(sellerBalance)}`)
      }

      level.totalQty -= matchedQty
      console.log(`Step 4.10: level ${JSON.stringify(level)}`)
      if(makerOrder.filledQty == makerOrder.quantity) level.orders.shift()
      }
    
    if(level?.orders.length == 0) oppBook.delete(levelPrice)
    console.log(`Step 4.11: level ${JSON.stringify(level)}`)
  }
  
  if(incomingOrder.type == 'market' && incomingOrder.side == 'sell' && incomingOrder.filledQty > 0) incomingOrder.status = 'Partially-filled' 

  if(incomingOrder.filledQty < incomingOrder.quantity && incomingOrder.type == "limit"){
    restOrderOnBook(incomingOrder)
    console.log(`Step 4.12: rest on orderbook`)
  }

  console.log(`Step last: Balance `)
  console.log(balance)
  return { order: incomingOrder, fills: orderFill }

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