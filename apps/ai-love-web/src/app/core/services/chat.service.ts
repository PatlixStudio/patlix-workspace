import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../models/chat';
import { environment } from '../../../environments/environment';

export type { ChatMessage };

const NSFW_OPTIN_KEY = 'ai-love.nsfw-optin.v1';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private currentCompanionId: string | null = null;
  private readonly http = inject(HttpClient);

  private getAllowExplicit(): boolean {
    try {
      return localStorage.getItem(NSFW_OPTIN_KEY) === 'true';
    } catch {
      return false;
    }
  }

  async sendMessage(
    companionId: string,
    message: string,
    history: ChatMessage[],
  ): Promise<string> {
    this.currentCompanionId = companionId;
    
    const response = await firstValueFrom(
      this.http.post<{ response: string }>(`${this.apiUrl}/${companionId}`, {
        message,
        history: history.map(m => ({ role: m.role, content: m.content })),
        allowExplicit: this.getAllowExplicit(),
      }),
    );
    
    return response.response;
  }

  async getHistory(companionId: string): Promise<ChatMessage[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ messages: ChatMessage[] }>(`${this.apiUrl}/${companionId}/history`),
      );
      return response.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch {
      return [];
    }
  }

  async clearHistory(companionId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${companionId}/history`),
    );
  }

  /**
   * Synthesises speech in the companion's unique voice.
   * @returns an object URL for the audio blob — revoke it after playback.
   */
  async speak(companionId: string, text: string): Promise<string> {
    const blob = await firstValueFrom(
      this.http.post(`${this.apiUrl}/chat/${companionId}/speak`, { text }, { responseType: 'blob' }),
    );
    return URL.createObjectURL(blob);
  }

  clearCurrentSession(): void {
    this.currentCompanionId = null;
  }

  getCurrentCompanionId(): string | null {
    return this.currentCompanionId;
  }

  isExplicitAllowed(): boolean {
    return this.getAllowExplicit();
  }

  setExplicitAllowed(allowed: boolean): void {
    try {
      localStorage.setItem(NSFW_OPTIN_KEY, allowed.toString());
    } catch {
      // ignore
    }
  }
}