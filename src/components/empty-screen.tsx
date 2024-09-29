import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-zinc-50 sm:p-8 p-4 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block">
          PKS Interactive
        </h1>
        <p className="leading-normal text-zinc-900">
          This is an open source AI chatbot built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://sdk.vercel.ai">
            Vercel AI SDK
          </ExternalLink>
          , and{' '}
          <ExternalLink href="https://ai.google.dev">
            OpenAI
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-zinc-900">
          It uses{' '}
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            React Server Components
          </ExternalLink>{' '}
          with function calling to mix both text with generative UI responses
          from ChatGPT. When a user has a questions, it creates a SQL query, receives a response from the database, and then generates a UI response.
        </p>
        <p className="leading-normal text-zinc-900">
          The data used is the <ExternalLink href='https://www.bka.de/EN/CurrentInformation/Statistics/PoliceCrimeStatistics/policecrimestatistics_node.html'>
          German Police Crime Statistics
          </ExternalLink> which is published every year by the Bundeskriminalamt (BKA) and contains data on crimes reported to the police in Germany.
        </p>
      </div>
    </div>
  )
}