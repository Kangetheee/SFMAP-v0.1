"use client";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LiteracyPage({ className, ...props }: React.ComponentProps<"div">) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  
  const { 
    messages, 
    input, 
    setInput, 
    handleSubmit: originalHandleSubmit, 
    isLoading, 
    stop, 
    reload, 
    error 
  } = useChat({ api: "/api/gemini" });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowChatIcon(true);
      } else {
        setShowChatIcon(false);
        setIsChatOpen(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    originalHandleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">Chat with AI Assistant</h1>
      <p className="text-muted-foreground text-sm">
        Get help with any questions you have about literacy and education.
      </p>
    </header>
  );

  const messageList = (
    <div className="my-4 flex h-fit min-h-full flex-col gap-4">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className="max-w-[80%] rounded-xl px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-gray-100 data-[role=user]:bg-blue-500 data-[role=assistant]:text-black data-[role=user]:text-white"
        >
          <ReactMarkdown
            children={message.content}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                return inline ? (
                  <code {...props} className="bg-gray-200 px-1 rounded">
                    {children}
                  </code>
                ) : (
                  <pre {...props} className="bg-gray-200 p-2 rounded">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
              ul: ({children}) => (
                <ul className="list-disc ml-4">
                  {children}
                </ul>   
              ),
              ol: ({children}) => (
                <ol className="list-decimal ml-4">
                  {children}
                </ol>
              )
            }}
          />
        </div>
      ))}
      {isLoading && (
        <div className="self-center flex items-center gap-3 mt-4">
          <div className="animate-spin h-5 w-5 text-primary border-t-2 border-b-2 border-primary rounded-full"></div>
          <button
            className="underline text-sm text-blue-600 hover:text-blue-800"
            type="button"
            onClick={() => stop()}
          >
            Abort
          </button>
        </div>
      )}
      {error && (
        <div className="self-center flex items-center gap-3">
          <div>An error occurred</div>
          <button
            className="underline text-sm"
            type="button"
            onClick={() => reload()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );

  return (
    <main
      className={cn(
        "ring-none mx-auto flex h-svh max-h-svh w-full max-w-[35rem] flex-col items-stretch border-none",
        className,
      )}
      {...props}
    >
      <div className="flex-1 content-center overflow-y-auto px-6 bg-gradient-to-b from-gray-50 to-white">
        {messages.length ? messageList : header}
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-input bg-background focus-within:ring-ring/10 relative mx-6 mb-6 flex items-center rounded-[16px] border px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
      >
        <AutoResizeTextarea
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Type your message..."
          className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute bottom-1 right-1 size-6 rounded-full"
              disabled={isLoading}
              type="submit"
            >
              <Send size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={12}>Send</TooltipContent>
        </Tooltip>
      </form>
    </main>
  );
}