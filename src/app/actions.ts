import { Chat } from "@/lib/types";




export async function saveChat(chat: Chat) {
    
    console.log('chat', chat)
    
    // const session = await auth()
  
    // if (session && session.user) {
    //   const pipeline = kv.pipeline()
    //   pipeline.hmset(`chat:${chat.id}`, chat)
    //   pipeline.zadd(`user:chat:${chat.userId}`, {
    //     score: Date.now(),
    //     member: `chat:${chat.id}`
    //   })
    //   await pipeline.exec()
    // } else {
    //   return
    // }
  }