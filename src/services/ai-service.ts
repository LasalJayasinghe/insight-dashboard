import { ENV } from "@/config/env";
import type { ToolActivity } from "@/lib/assistant-types";
import { tokenService } from "./tokenService";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AiChatRequest = {
  prompt: string;
  conversationId?: string;
  /** Earlier turns (oldest first) so the assistant remembers the conversation. */
  history?: ChatTurn[];
};

export type AiStreamEvent = { type: "text"; text: string } | { type: "tool"; tool: ToolActivity };

/**
 * Server stream format (SSE):
 *   data: <text chunk>     reply text ("\n" escaped as a literal backslash-n)
 *   tool: {"name","status","description"}   tool activity
 *   data: [DONE]           end of reply
 */
function parseLine(line: string): AiStreamEvent | "done" | null {
  const trimmed = line.trimEnd();
  if (trimmed.startsWith("data: ")) {
    const data = trimmed.slice(6);
    if (data === "[DONE]") return "done";
    return { type: "text", text: data.replace(/\\n/g, "\n") };
  }
  if (trimmed.startsWith("tool: ")) {
    try {
      const t = JSON.parse(trimmed.slice(6)) as Partial<ToolActivity>;
      if (t.name && t.status) {
        return {
          type: "tool",
          tool: { name: t.name, status: t.status, description: t.description ?? t.name },
        };
      }
    } catch {
      // Malformed tool line: ignore it rather than breaking the reply.
    }
  }
  return null;
}

export const aiService = {
  /** Sends a message and streams the reply (text chunks and tool activity) as an async generator. */
  async *streamMessage(
    input: AiChatRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<AiStreamEvent, void, unknown> {
    const token = tokenService.get();
    const response = await fetch(`${ENV.API_BASE_URL}/aichat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
      signal, // Stop cancels the request server-side too, not just the UI loop.
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body returned from the server.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    // Network chunks split lines arbitrarily; keep the trailing partial line for the next chunk.
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const ev = parseLine(line);
          if (ev === "done") return;
          if (ev) yield ev;
        }
      }

      // Flush a final line that arrived without a trailing newline.
      const ev = parseLine(buffer);
      if (ev && ev !== "done") yield ev;
    } finally {
      reader.releaseLock();
    }
  },
};
