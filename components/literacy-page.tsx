"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LiteracyPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  const chatIconRef = useRef<HTMLButtonElement>(null);

  const { 
    messages, input, handleInputChange, handleSubmit, isLoading, stop, reload, error 
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

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Card className="border-none drop-shadow-sm bg-gradient-to-b from-gray-200 via-green-100 to-gray-200">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">Chat with AI Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full mb-4">
            {!messages?.length && (
              <div className="w-full mt-32 text-gray-500 items-center justify-center flex gap-3">
                No Messages Yet
              </div>
            )}
            {messages?.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${ message.role === "user"? "text-right" : "text-left" }`}
              >
                <div
                    className={`inline-block rounded-lg p-3 ${
                        message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-black"
                    }`}
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
                            <li className="list-decimal ml-4">
                                {children}
                            </li>
                        )
                        }}
                    />
                </div>

              </div>
            ))}
            {isLoading && (
              <div className="w-full flex justify-center items-center gap-3 mt-4">
                <Loader2 className="animate-spin h-5 w-5 text-primary" />
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
              <div className="w-full flex justify-center items-center gap-3">
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
          </ScrollArea>
          <form onSubmit={onSubmit} className="flex w-full space-x-2">
            <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-grow bg-gradient-to-b from-gray-200 via-green-100 to-gray-200" />
            <Button type="submit" size="sm" disabled={isLoading}>
              <Send className="size-4 mr-2" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
