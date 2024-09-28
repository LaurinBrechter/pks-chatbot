import { Chat } from "@/lib/types";
import { promises as fs } from "fs";

export async function saveChat(chat: Chat) {
  try {
    // Convert chat object to JSON string
    const chatJson = JSON.stringify(chat, null, 2);

    const fileName = `chat-${chat.id}.json`;

    // create the file if it doesn't exist
    let handle = await fs.open(fileName, "w");
    

    // Write the JSON string to the file
    await fs.writeFile(fileName, chatJson, "utf8");

    await handle.close();

    // console.log("Chat saved successfully.");
  } catch (error) {
    console.error("Error saving chat:", error);
  }

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
