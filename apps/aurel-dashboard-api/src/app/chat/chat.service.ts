import { Injectable } from '@nestjs/common';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  time: string;
}

const AUREL_RESPONSES = [
  'Acknowledged. I\u2019ve queued that and will report back once it\u2019s done.',
  'On it. I\u2019ll pull the latest status from the relevant subagents and get back to you.',
  'Understood. I\u2019ve added that to the task queue for the next coordination cycle.',
  'Received. Let me check with the teams and I\u2019ll confirm shortly.',
];

/**
 * Chat service — placeholder coordination endpoint. Replies are canned for
 * now; wire to a real model/agent later.
 */
@Injectable()
export class ChatService {
  private counter = 0;

  respond(request: ChatRequest): ChatResponse {
    void request;
    const now = new Date();
    const reply = AUREL_RESPONSES[this.counter % AUREL_RESPONSES.length];
    this.counter += 1;
    return {
      reply,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}