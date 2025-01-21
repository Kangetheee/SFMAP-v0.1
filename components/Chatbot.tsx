"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export const Chatbot = () => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e)
  }

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-xl line-clamp-1">Chat with AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full mb-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex mb-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-2 ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 text-black rounded-lg p-2">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>
        <form onSubmit={onSubmit} className="flex w-full space-x-2">
          <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-grow" />
          <Button type="submit" size="sm" disabled={isLoading}>
            <Send className="size-4 mr-2" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

