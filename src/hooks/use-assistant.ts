import { useCallback, useRef, useState } from "react";
import { assistantClient } from "@/lib/assistant-client";
import { createMessage, type AssistantClient, type Message } from "@/lib/assistant-types";

export function useAssistant(client: AssistantClient = assistantClient) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isThinking) return;

      const userMessage = createMessage("user", content);
      const history = [...messages, userMessage];
      setMessages(history);
      setIsThinking(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await client.send(history, controller.signal);
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", res.content, res.toolActivity),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setIsThinking(false);
      }
    },
    [client, isThinking, messages],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsThinking(false);
  }, []);

  return { messages, isThinking, error, send, reset };
}
