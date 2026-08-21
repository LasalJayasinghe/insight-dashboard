import { ENV } from "@/config/env";
import { tokenService } from "./tokenService";

export type AiChatRequest = {
  prompt: string;
  conversationId?: string;
};

export const aiService = {
  /**
   * Sends a message to the AI agent and streams the response back via an async generator.
   */
  async *streamMessage(input: AiChatRequest): AsyncGenerator<string, void, unknown> {
    const token = tokenService.get();
    const response = await fetch(`${ENV.API_BASE_URL}/aichat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body returned from the server.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse SSE chunk format
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).replace(/\\n/g, '\n');
            yield data;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
