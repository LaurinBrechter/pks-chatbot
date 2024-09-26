import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export default async function Page() {
  let db = await open({
    filename: "./data/pks2013.db", // Specify the database file path
    driver: sqlite3.Database, // Specify the database driver (sqlite3 in this case)
  });

  let history = [
    {
      role: "user",
      content: "How many cases of sexual abuse of minors were there in Hamburg?",
    },
  ];

  const steps = await generateText({
    model: openai("gpt-4-turbo"),
    temperature: 0,
    system: `\
      You are a friendly assistant that helps the user obtain more information about German police reports. The table is named 'police_reports_2013' and has the following schema:
        {
        'name': 'crime',
        'type': 'string',
        'description': 'Type of crime'
    },
    {
        'name': 'state',
        'type': 'string',
        'description': 'state where the type of crimes were committed'
    },
    {
        'name': 'num_cases',
        'type': 'integer',
        'description': 'Number of crimes in the given year and state'
    }

        Please output a SQL Query, If you need to apply a filter but don't know the values, tuse the 'showDistinctValues' tool.\
      `,
    messages: [...history],
    maxSteps: 2,
    tools: {
      showDistinctValues: tool({
        description:
          "Shows the distinct values of one or more columns. This is useful for understanding the data in a table and applying filtering.",
        parameters: z.object({
          columns: z.array(z.string()),
        }),
        execute: async ({ columns }) => {
          let distinct_values = await Promise.all(columns.map(async (column) => {
            let q = `SELECT DISTINCT ${column} FROM pks2013`;
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
    },
  });

  console.log(steps);

  //   const allToolCalls = steps.flatMap(step => step.toolCalls);
}
