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
