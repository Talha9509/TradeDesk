import { CreateOrder } from '../Options/CreateOrder'
import { CancelOrder } from '../Options/CancelOrder'
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

//   if(engineReq.function == 'cancel_order'){

//   }

}