"use client";

import { AI, Message } from "@/lib/chat/actions";
// import { ChatList } from "@/components/chat-list";
import { ChatPanel } from "@/components/ChatPanel";
import { useEffect, useState } from "react";
import { useScrollAnchor } from "@/lib/hooks/use-scroll-anchor";
import { useActions, useAIState, useUIState } from "ai/rsc";
import { cn } from "@/lib/utils";
import { EmptyScreen } from "./empty-screen";
import { ChatList } from "./chat-list";
import Header from "./Header";
import { Footer } from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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

  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState] = useAIState();

  const handleDownload = () => {
    const aiStateJson = JSON.stringify(aiState, null, 2);
    const blob = new Blob([aiStateJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aiState.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const { handleUpload } = useActions();

  console.log(aiState);
  
  return (
    <div className="w-full overflow-auto pl-0" ref={scrollRef}>
      <Header />
      <ChatPanel
        id={id}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
      <div className={cn("pb-[200px] pt-4", className)} ref={messagesRef}>
        {messages.length ? (
          <ChatList messages={messages} isShared={false} />
        ) : (
          <EmptyScreen />
        )}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
      <div className="absolute bottom-4 right-4 z-10 grid gap-2">
        <Button onClick={handleDownload}>Save History</Button>
        <form
          action={async (formData) => {
            const uiState = await handleUpload(formData);
            setMessages(uiState);
          }}
          className="gap-2 grid"
        >
          <Button className="w-full">Upload History</Button>
          <Input id="file" type="file" name="aiState" required />
        </form>
      </div>
    </div>
  );
}
