export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  companionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}