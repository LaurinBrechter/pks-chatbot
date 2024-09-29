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
import { SimpleBar } from "@/components/SimpleBar";
import QueryResults from "@/components/QueryResults";

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
  console.log("history", aiState.get().messages);

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

  // console.log('history', history);

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
        If the user wants to plot the results, they can use the 'plotResultsBar' tool.\
        Do NOT print the results of the query, the user will be able to see them via the UI already.\
        `,
        messages: [...history],
        maxSteps: 10,
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
                  return {
                    column: column,
                    values: await db.all(q),
                  };
                })
              );
              return distinct_values;
            },
          }),
          querySQL: tool({
            description: "Query the SQL database",
            parameters: z.object({
              query: z.string(),
              visualize: z.boolean(),
            }),
            execute: async ({ query }) => {
              return await db.all(query);
            },
          }),
          plotResultsBar: tool({
            description: "Plot the results of the query as a bar chart",
            parameters: z.object({
              x: z.array(z.string()),
              y: z.array(z.number()),
            }),
            execute: async ({ x, y }) => {
              console.log("plotting bar", x, y);
              return "Plotted the results as a bar chart";
            },
          }),
          // plotResultsLine: tool({
          //   description: "Plot the results of the query as a line chart",
          //   parameters: z.object({
          //     x: z.array(z.any()),
          //     y: z.array(z.number()),
          //   })
          // })
        },
      });

      let textContent = "";
      spinnerStream.done(null);

      const msgId = nanoid();
      for await (const delta of result.fullStream) {
        const { type } = delta;

        if (type === "text-delta") {
          const { textDelta } = delta;
          textContent += textDelta;
          messageStream.update(<BotMessage content={textContent} />);
        } else if (type === "tool-call") {
          const { toolName, args, toolCallId } = delta;

          if (toolName === "showDistinctValues") {
            const { columns } = args;

            uiStream.append(<BotCard>{columns}</BotCard>);
          } else if (toolName == "querySQL") {
            const { query, visualize } = args;

            const result = await db.all(query);

            uiStream.append(
              <BotCard>
                <QueryResults data={result} query={query} />
              </BotCard>
            );
          } else if (toolName == "plotResultsBar") {
            let { x, y } = args;

            uiStream.append(
              <BotCard>
                <SimpleBar x={x} y={y} chartTitle="hello" />
              </BotCard>
            );
          }
          // else if (toolName == "plotResultsLine") {

          // }
        }
      }

      uiStream.done();
      textStream.done();
      messageStream.done();

      let rm = await result.responseMessages;

      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, ...rm],
      });
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
