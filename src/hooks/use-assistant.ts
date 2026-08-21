import { useCallback, useRef, useState } from "react";
import { aiService } from "@/services/ai-service";
import { createMessage, type Message } from "@/lib/assistant-types";

export function useAssistant() {
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
        setMessages((prev) => [...prev, createMessage("assistant", "")]);
        
        let accumulatedContent = "";
        const generator = aiService.streamMessage({ prompt: content });

        for await (const chunk of generator) {
          if (controller.signal.aborted) break;
          accumulatedContent += chunk;
          setMessages((prev) => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = { ...last, content: accumulatedContent };
            return newMessages;
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, messages],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsThinking(false);
  }, []);

  return { messages, isThinking, error, send, reset };
}
