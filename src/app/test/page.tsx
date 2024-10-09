import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export default async function Page() {
  let db = await open({
    filename: "./data/pks.db", // Specify the database file path
    driver: sqlite3.Database, // Specify the database driver (sqlite3 in this case)
  });

  let history = [
    {
      role: "user",
      content: "How many cases of theft of firearms where there in Hamburg over the years?",
    },
  ];

  const steps = await generateText({
    model: openai("gpt-4-turbo"),
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
          let distinct_values = await Promise.all(columns.map(async (column) => {
            let q = `SELECT DISTINCT ${column} FROM pks`;
            console.log(q);
            return {
              column: column,
              values: await db.all(q),
            };
          }));
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
          return await db.all(query);
        }
      })
    },
  });

  const allToolCalls = steps.steps.flatMap((step) => step.toolCalls);
  console.log(allToolCalls);
  console.log(steps);

  //   const allToolCalls = steps.flatMap(step => step.toolCalls);
}
