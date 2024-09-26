"use client";

import * as React from "react";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { IconArrowElbow, IconPlus } from "@/components/ui/icons";
import { toast } from 'sonner'
import { useActions, useUIState } from "ai/rsc";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { type AI } from "@/lib/chat/actions";
import { UserMessage } from "./stocks/message";
import { nanoid } from "@/lib/utils";

export function ChatForm({
  input,
  setInput,
}: {
  input: string;
  setInput: (value: string) => void;
}) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const { submitUserMessage, describeImage } = useActions();
  const [_, setMessages] = useUIState<typeof AI>();

  return (
    <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-zinc-100 px-12 sm:rounded-full sm:px-12">
      {/* <Tooltip>
          <TooltipTrigger asChild> */}
      <form
        ref={formRef}
        onSubmit={async (e: any) => {
          e.preventDefault();

          // Blur focus on mobile
          if (window.innerWidth < 600) {
            e.target["message"]?.blur();
          }

          const value = input.trim();
          setInput("");
          if (!value) return;

          // Optimistically add user message UI
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id: nanoid(),
              display: <UserMessage>{value}</UserMessage>,
            },
          ]);

          try {
            // Submit and get response message
            const responseMessage = await submitUserMessage(value);
            setMessages((currentMessages) => [
              ...currentMessages,
              responseMessage,
            ]);
          } catch {
            toast(
              <div className="text-red-600">
                You have reached your message limit! Please try again later, or{" "}
                <a
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://vercel.com/templates/next.js/gemini-ai-chatbot"
                >
                  deploy your own version
                </a>
                .
              </div>
            );
          }
        }}
      >
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
          //   onClick={() => {
          //     fileRef.current?.click()
          //   }}
        >
          <IconPlus />
          <span className="sr-only">New Chat</span>
        </Button>
        {/* </TooltipTrigger>
          <TooltipContent>Add Attachments</TooltipContent>
        </Tooltip> */}
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full bg-transparent placeholder:text-zinc-900 resize-none px-4 py-[1.3rem] focus-within:outline-none sm:text-sm outline-none"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="absolute right-4 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={input === ""}
                className="bg-transparent shadow-none text-zinc-950 rounded-full hover:bg-zinc-200"
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </form>
    </div>
  );
}
