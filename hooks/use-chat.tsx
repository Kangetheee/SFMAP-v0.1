import { useState } from "react";
import axios from "axios";

export function useChat() {
  const [messages, setMessages] = useState<{ id: string; content: string; role: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('API Error:', data.error);
            alert(`Error: ${data.error}`);
            return;
        }

        if (data.generated_text) {
            setMessages((prev) => [...prev, { role: 'user', content: input }, { role: 'ai', content: data.generated_text }]);
        } else {
            console.error('Unexpected API response:', data);
            alert('Unexpected API response format');
        }
    } catch (error) {
        console.error('Request failed:', error);
        alert('Something went wrong. Please try again.');
    }
};


  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
  };
}
