import { Chat } from "../types";
import {
  BotCard,
  BotMessage,
  SpinnerMessage,
  UserMessage,
} from "@/components/stocks/message";
import { nanoid, sleep } from "@/lib/utils";
import { streamText, tool } from "ai";
import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  createStreamableValue,
} from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { saveChat } from "@/app/actions";

import { z } from "zod";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";


export type Message = {
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  content: string;
  id?: string;
  name?: string;
  display?: {
    name: string;
    props: Record<string, any>;
  };
};

export type AIState = {
  chatId: string;
  interactions?: string[];
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
  spinner?: React.ReactNode;
  attachments?: React.ReactNode;
}[];

async function submitUserMessage(content: string) {
  "use server";

  // await rateLimit()

  let db = await open({
    filename: "./data/pks.db", // Specify the database file path
    driver: sqlite3.Database, // Specify the database driver (sqlite3 in this case)
  });

  const aiState = getMutableAIState();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: "user",
        content: `${aiState.get().interactions.join("\n\n")}\n\n${content}`,
      },
    ],
  });

  const history = aiState.get().messages.map((message: Message) => ({
    role: message.role,
    content: message.content,
  }));

  const textStream = createStreamableValue("");
  const spinnerStream = createStreamableUI(<SpinnerMessage />);
  const messageStream = createStreamableUI(null);
  const uiStream = createStreamableUI();

  (async () => {
    try {
      const result = await streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0,
        system: `\
      You are a friendly assistant that helps the user obtain more information about German police reports. The table is named 'pks' and has the following schema:
        {
        'name': 'label',
        'type': 'string',
        'description': 'Type of crime'
    },
    {
        'name': 'state',
        'type': 'string',
        'description': 'state where the type of crimes were committed'
    },
    {
      'name': 'year',
      'type': 'integer',
      'description': 'Year of the crime'
    },
    {
        'name': 'count',
        'type': 'integer',
        'description': 'Number of crimes in the given year and state'
    }

        If you need to use a where clause to filter for data, make sure to first use the 'showDistinctValues' to see what distinct values there are.\
        Then you can use the 'querySQL' tool to query the database.\
        You can then respond the user with the results of the query.\
      `,
        messages: [...history],
        maxSteps: 5,
        tools: {
          showDistinctValues: tool({
            description:
              "Shows the distinct values of one or more columns. This is useful for understanding the data in a table and applying filtering.",
            parameters: z.object({
              columns: z.array(z.string()),
            }),
            execute: async ({ columns }) => {
              let distinct_values = await Promise.all(
                columns.map(async (column) => {
                  let q = `SELECT DISTINCT ${column} FROM pks`;
                  console.log(q);
                  return {
                    column: column,
                    values: await db.all(q),
                  };
                })
              );
              console.log(distinct_values);
              return distinct_values;
            },
          }),
          querySQL: tool({
            description: "Query the SQL database",
            parameters: z.object({
              query: z.string(),
            }),
            execute: async ({ query }) => {
              console.log(query);
              return await db.all(query);
            },
          }),
          
        },
      });

      let textContent = "";
      spinnerStream.done(null);

      let newMessage = {
        id: nanoid(),
        role: "assistant",
        content: "",
      };

      const msgId = nanoid();
      for await (const delta of result.fullStream) {
        const { type } = delta;

        if (type === "text-delta") {
          const { textDelta } = delta;

          textContent += textDelta;
          newMessage.content = textContent;
          messageStream.update(<BotMessage content={textContent} />);
            aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages.filter((message: Message) => message.id !== msgId),
              {
              id: msgId,
              role: "assistant",
              content: textContent,
              },
            ],
            });
        } else if (type === "tool-call") {
          const { toolName, args } = delta;

          if (toolName === "showDistinctValues") {
            const { columns } = args;
            
            uiStream.append(
              <BotCard>
                {columns}
              </BotCard>
            )

            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `Here's a list of the distinct values of the column ${columns.join(', ')}.`,
                  display: {
                    name: 'showDistinctValues',
                    props: {
                      columns
                    }
                  }
                }
              ]
            })

          } else if (toolName == "querySQL") {
            const { query } = args;

            const result = await db.all(query);

            uiStream.append(
              <BotCard>
                {
                  query
                }
                {
                  JSON.stringify(result, null, 2)
                }
              </BotCard>
            )

            console.log(aiState.get());

            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `Here's the result of the query: ${query}.`,
                  display: {
                    name: 'querySQL',
                    props: {
                      query
                    }
                  }
                }
              ]
            })
          }
        }
      }

      uiStream.done();
      textStream.done();
      messageStream.done();
    } catch (e) {
      console.error(e);

      const error = new Error(
        "The AI got rate limited, please try again later."
      );
      uiStream.error(error);
      textStream.error(error);
      messageStream.error(error);
      aiState.done();
    }
  })();

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value,
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), interactions: [], messages: [] },
  onGetUIState: async () => {
    "use server";

    // const session = await auth();

    // if (session && session.user) {
    const aiState = getAIState();

    // if (aiState) {
    const uiState = getUIStateFromAIState(aiState);
    return uiState;
    // }
    // } else {
    // return;
    // }
  },
  onSetAIState: async ({ state }) => {
    "use server";

    // const session = await auth();

    // if (session && session.user) {
    const { chatId, messages } = state;

    const createdAt = new Date();
    const userId = "dirk" as string;
    const path = `/chat/${chatId}`;
    const title = messages[0].content.substring(0, 100);

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
      path,
    };

    await saveChat(chat);
  },
});

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter((message) => message.role !== "system")
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === "assistant" ? (
          <BotMessage content={message.content} />
        ) : message.role === "user" ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        ),
    }));
};
