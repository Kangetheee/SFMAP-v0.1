"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function LiteracyPage({ className, ...props }: React.ComponentProps<"div">) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showChatIcon, setShowChatIcon] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({
    api: "/api/gemini",
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowChatIcon(true)
      } else {
        setShowChatIcon(false)
        setIsChatOpen(false)
      }
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    originalHandleSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest("form")
      if (form) {
        const formEvent = new Event("submit", { bubbles: true, cancelable: true })
        form.dispatchEvent(formEvent)
      }
    }
  }

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">Chat with AI Assistant</h1>
      <p className="text-muted-foreground text-sm">
        Get help with any questions you have about literacy and education.
      </p>
    </header>
  )

  const messageList = (
    <div className="my-4 flex h-fit min-h-full flex-col gap-4">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className={cn(
            "max-w-[80%] rounded-xl px-3 py-2 text-sm",
            message.role === "assistant" ? "self-start bg-gray-100 text-black" : "self-end bg-blue-500 text-white",
          )}
        >
          {message.content && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const content = String(children).replace(/\n$/, "")
                  return inline ? (
                    <code {...props} className="bg-gray-200 px-1 rounded">
                      {content}
                    </code>
                  ) : (
                    <pre {...props} className="bg-gray-200 p-2 rounded overflow-x-auto">
                      <code {...props}>{content}</code>
                    </pre>
                  )
                },
                ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4">{children}</ol>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
      {isLoading && (
        <div className="self-center flex items-center gap-3 mt-4">
          <div className="animate-spin h-5 w-5 text-primary border-t-2 border-b-2 border-primary rounded-full"></div>
          <button className="underline text-sm text-blue-600 hover:text-blue-800" type="button" onClick={() => stop()}>
            Abort
          </button>
        </div>
      )}
      {error && (
        <div className="self-center flex items-center gap-3 text-red-500">
          <div>An error occurred. Please try again.</div>
          <button
            className="underline text-sm text-blue-600 hover:text-blue-800"
            type="button"
            onClick={() => reload()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
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
    </TooltipProvider>
  )
}

