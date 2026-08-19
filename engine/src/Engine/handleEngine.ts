import { CreateOrder } from '../Options/CreateOrder'
import { CancelOrder } from '../Options/CancelOrder'
import { GetOrder } from '../Options/GetOrder'
import { GetBalance } from '../Options/GetBalance'
import { type EngineRequest } from '../Types/EngineTypes'
import { GetDepth } from '../Options/GetDepth'
import snapshot from '../snapshot/snapshot'

export default async function handleEngine(engineReq: EngineRequest) {
  if(engineReq.function == 'create_order'){
    const result = await CreateOrder(engineReq.payload, engineReq.userId)
    snapshot().catch((err) => {
      console.error("Snapshot failed:", err);
    });
    return result
  }

  else if(engineReq.function == 'cancel_order'){
    const result = await CancelOrder(engineReq.payload, engineReq.userId)
    console.log(result)
    snapshot().catch((err) => {
      console.error("Snapshot failed:", err);
    });
    return result
  }

  else if(engineReq.function == 'get_order'){
    const result = await GetOrder(engineReq.payload, engineReq.userId)
    console.log(result)
    snapshot().catch((err) => {
      console.error("Snapshot failed:", err);
    });
    return result
  }
  
  else if(engineReq.function == 'get_user_balance'){
    const result = await GetBalance(engineReq.userId)
    console.log(result)
    snapshot().catch((err) => {
      console.error("Snapshot failed:", err);
    });
    return result
  }

  else if(engineReq.function == 'get_depth'){
    const result = await GetDepth(engineReq.payload)
    console.log(result)
    snapshot().catch((err) => {
      console.error("Snapshot failed:", err);
    });
    return result
  }

}