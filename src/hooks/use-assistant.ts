import { useCallback, useEffect, useRef, useState } from "react";
import { aiService, type ChatTurn } from "@/services/ai-service";
import { createMessage, type Message, type ToolActivity } from "@/lib/assistant-types";

/** How many earlier messages are sent so the assistant keeps the conversation's context. */
const HISTORY_LIMIT = 12;

function toHistory(messages: Message[]): ChatTurn[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));
}

/** Inserts or updates a tool's status (a tool reports "running" then "completed"/"failed"). */
function upsertTool(list: ToolActivity[] | undefined, tool: ToolActivity): ToolActivity[] {
  const current = list ?? [];
  const i = current.findIndex(
    (t) => t.name === tool.name && t.description === tool.description && t.status === "running",
  );
  if (i === -1) return [...current, tool];
  const next = [...current];
  next[i] = tool;
  return next;
}

export function useAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Don't keep streaming into an unmounted widget.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isThinking) return;

      const history = toHistory(messages);
      const userMessage = createMessage("user", content);
      const placeholder = createMessage("assistant", "");
      setMessages((prev) => [...prev, userMessage, placeholder]);
      setIsThinking(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const update = (fn: (m: Message) => Message) =>
        setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? fn(m) : m)));

      try {
        let accumulated = "";
        for await (const ev of aiService.streamMessage(
          { prompt: content, history },
          controller.signal,
        )) {
          if (ev.type === "tool") {
            update((m) => ({ ...m, toolActivity: upsertTool(m.toolActivity, ev.tool) }));
          } else {
            accumulated += ev.text;
            update((m) => ({ ...m, content: accumulated }));
          }
        }

        if (!accumulated.trim()) {
          update((m) => ({
            ...m,
            content: controller.signal.aborted ? "_Stopped._" : "_No response from the assistant._",
          }));
        }
      } catch (e) {
        if (controller.signal.aborted) {
          update((m) => (m.content.trim() ? m : { ...m, content: "_Stopped._" }));
        } else {
          setError(e instanceof Error ? e.message : "Something went wrong.");
          setMessages((prev) => prev.filter((m) => m.id !== placeholder.id));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsThinking(false);
      }
    },
    [isThinking, messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsThinking(false);
  }, []);

  return { messages, isThinking, error, send, stop, reset };
}
