import { Chat } from "@/lib/types";
import { promises as fs } from "fs";

export async function saveChat(chat: Chat) {
  try {
    // Convert chat object to JSON string
    const chatJson = JSON.stringify(chat, null, 2);

    // Define the file path where the chat will be saved
    const filePath = "./chat.json";

    // Write the JSON string to the file
    await fs.writeFile(filePath, chatJson, "utf8");

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
