import type { AssistantClient, AssistantResponse, Message } from "./assistant-types";

/**
 * Placeholder client used until the MCP-backed agent is wired up.
 * Replace with an HTTP client hitting the .NET endpoint, e.g.:
 *
 *   export const assistantClient: AssistantClient = {
 *     async send(messages, signal) {
 *       const res = await apiClient.post("/assistant/chat", { messages }, { signal });
 *       return res.data;
 *     },
 *   };
 */
export const assistantClient: AssistantClient = {
  async send(messages: Message[]): Promise<AssistantResponse> {
    const last = messages[messages.length - 1]?.content ?? "";
    await new Promise((r) => setTimeout(r, 900));
    return {
      content: [
        "The AlertMe AI agent is not connected yet.",
        "",
        `Once the MCP server is live, I'll answer **“${last.trim()}”** using your live portfolios, watchlists, alerts and market data.`,
      ].join("\n"),
      toolActivity: [
        { name: "connect", status: "failed", description: "Connecting to AlertMe AI agent" },
      ],
    };
  },
};
