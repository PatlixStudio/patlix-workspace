import { Injectable } from '@angular/core';

export interface ChatReply {
  reply: string;
  time: string;
}

/**
 * Talks to the Aurel Dashboard API chat endpoint (`/api/chat`).
 * The dev server proxies `/api` to `http://localhost:3003`.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  /** Sends a user message and returns Aurel's reply. */
  async send(message: string): Promise<ChatReply> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      throw new Error(`Chat request failed: ${res.status}`);
    }
    return res.json() as Promise<ChatReply>;
  }
}