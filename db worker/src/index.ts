import { dbclient } from "./config/redis"

console.log("started")
const engTodb = 'engine_to_db'
let lastId = '$'
while(1){
  const response = await dbclient.xRead({ key: engTodb, id: lastId }, { COUNT: 5, BLOCK: 100 })
  const stream = response?.[0]
  if (!response || response.length == 0 || response == undefined || !stream) continue
  
  console.log(response)
    for (const message of stream.messages) {
      console.log(message);
      const stringifiedMessage = message.message.abc
      console.log(stringifiedMessage)
      
      lastId = message.id;
    }
}