import { CreateOrder } from '../Options/CreateOrder'
import { type EngineRequest } from '../Types/types'

export default async function handleEngine(engineReq: EngineRequest) {
  if(engineReq.function == 'create_order'){
    const result = await CreateOrder(engineReq.data, engineReq.userId)
    return result
  }

//   if(engineReq.function == 'deposit'){

//   }

//   if(engineReq.function == 'cancel_order'){

//   }

}