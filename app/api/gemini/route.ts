import { streamText, type Message } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { initialMessage } from "@/lib/data";
import { nanoid } from "nanoid";

export const runtime = "edge";

// Environment variable validation
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

// Initialize the Google Generative AI client
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Constants
const MODEL_NAME = "gemini-pro";
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Prepends the initial system message to the conversation history
 * and ensures all messages have valid IDs
 */
const prepareConversationHistory = (messages: Message[]): Message[] => [
  {
    id: nanoid(),
    role: "system", // Changed from "user" to "system" for the initial message
    content: initialMessage.content
  },
  ...messages.map((message) => ({
    id: message.id || nanoid(),
    role: message.role,
    content: message.content
  }))
];

/**
 * API route handler for Gemini text generation
 */
export async function POST(request: Request) {
  try {
    const { messages, temperature = DEFAULT_TEMPERATURE } = await request.json();
    
    // Validate messages
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Create the text stream
    const stream = await streamText({
      model: googleAI(MODEL_NAME),
      messages: prepareConversationHistory(messages),
      temperature,
    });
    
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}