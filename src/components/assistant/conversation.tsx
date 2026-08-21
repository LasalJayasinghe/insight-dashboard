import { useEffect, useRef } from "react";
import type { Message } from "@/lib/assistant-types";
import { cn } from "@/lib/utils";
import { AssistantMark } from "./assistant-mark";
import { MessageMarkdown } from "./message-markdown";
import { ToolActivityPanel } from "./tool-activity-panel";

export const SUGGESTIONS = [
  "How are my portfolios doing today?",
  "What are my best performing positions?",
  "What's moving in my portfolio?",
  "Show me today's biggest market movements",
  "Do I have any important alerts?",
];

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-center px-4 py-6">
      <div className="grid size-9 place-items-center border border-hairline bg-card text-foreground">
        <AssistantMark className="size-4" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-foreground">How can I help?</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Ask me about your portfolios, market movements, watchlist, or alerts.
      </p>

      <div className="mt-5 space-y-px border border-hairline bg-hairline">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <span className="truncate">{s}</span>
            <span aria-hidden className="font-mono text-xs opacity-50">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse bg-muted-foreground"
            style={{ animationDelay: `${i * 160}ms`, animationDuration: "1.1s" }}
          />
        ))}
      </span>
      <span className="label-caps">AlertMe AI is thinking…</span>
    </div>
  );
}

export function Conversation({
  messages,
  isThinking,
  error,
  onSend,
  expanded,
}: {
  messages: Message[];
  isThinking: boolean;
  error: string | null;
  onSend: (text: string) => void;
  expanded?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className={cn("mx-auto h-full w-full", expanded && "max-w-2xl")}>
          <EmptyState onPick={onSend} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className={cn("mx-auto w-full space-y-5 p-4", expanded && "max-w-2xl py-8")}>
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="mt-0.5 grid size-6 shrink-0 place-items-center border border-hairline bg-card text-foreground">
                <AssistantMark className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                {m.toolActivity?.length ? <ToolActivityPanel activity={m.toolActivity} /> : null}
                <MessageMarkdown content={m.content} />
              </div>
            </div>
          ),
        )}

        {isThinking && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 grid size-6 shrink-0 place-items-center border border-hairline bg-card text-foreground">
              <AssistantMark className="size-3" />
            </div>
            <Thinking />
          </div>
        )}

        {error && (
          <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
