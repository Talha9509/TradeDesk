import { CreateOrder } from '../Options/CreateOrder'
import { CancelOrder } from '../Options/CancelOrder'
import { GetOrder } from '../Options/GetOrder'
import { GetBalance } from '../Options/GetBalance'
import { type EngineRequest } from '../Types/EngineTypes'

export default async function handleEngine(engineReq: EngineRequest) {
  if(engineReq.function == 'create_order'){
    const result = await CreateOrder(engineReq.payload, engineReq.userId)
    return result
  }

  else if(engineReq.function == 'cancel_order'){
    const result = await CancelOrder(engineReq.payload, engineReq.userId)
    console.log(result)
    return result
  }

  else if(engineReq.function == 'get_order'){
    const result = await GetOrder(engineReq.payload, engineReq.userId)
    console.log(result)
    return result
  }
  
  else if(engineReq.function == 'get_user_balance'){
    const result = await GetBalance(engineReq.userId)
    console.log(result)
    return result
  }

}