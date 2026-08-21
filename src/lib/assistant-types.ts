export type MessageRole = "user" | "assistant";

export type ToolActivityStatus = "running" | "completed" | "failed";

export interface ToolActivity {
  name: string;
  status: ToolActivityStatus;
  description: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolActivity?: ToolActivity[];
}

/**
 * Transport abstraction. Swap the local handler for a real .NET / MCP agent
 * call without touching any of the chat UI components.
 */
export interface AssistantResponse {
  content: string;
  toolActivity?: ToolActivity[];
}

export interface AssistantClient {
  send(messages: Message[], signal?: AbortSignal): Promise<AssistantResponse>;
}

export const createMessage = (
  role: MessageRole,
  content: string,
  toolActivity?: ToolActivity[],
): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: new Date().toISOString(),
  ...(toolActivity ? { toolActivity } : {}),
});
