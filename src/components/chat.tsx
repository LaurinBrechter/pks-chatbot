'use client'

import { Message } from "@/lib/chat/actions";
// import { ChatList } from "@/components/chat-list";
import { ChatPanel } from "@/components/ChatPanel";
import { useEffect, useState } from "react";
import { useScrollAnchor } from "@/lib/hooks/use-scroll-anchor";
import { useAIState, useUIState } from "ai/rsc";
import { cn } from '@/lib/utils'
import { EmptyScreen } from "./empty-screen";
import { ChatList } from "./chat-list";
import Header from "./Header";
import { Footer } from "./Footer";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages?: Message[];
  id?: string;
  // session?: Session
  // missingKeys: string[]
}

export function Chat({ id, className }: ChatProps) {
  const [input, setInput] = useState("");

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  const [messages] = useUIState();
  const [aiState] = useAIState();

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <Header />
      <ChatPanel
        id={id}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
      <div className={cn('pb-[200px] pt-4', className)} ref={messagesRef}>
        {messages.length ? (
          <ChatList messages={messages} isShared={false} />
        ) : (
          <EmptyScreen />
        )}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
    </div>
  );
}
