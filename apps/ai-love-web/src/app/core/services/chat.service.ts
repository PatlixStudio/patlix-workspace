import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../models/chat';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type { ChatMessage };

const NSFW_OPTIN_KEY = 'ai-love.nsfw-optin.v1';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private currentCompanionId: string | null = null;
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

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
      this.http.post<{ response: string }>(
        `${this.apiUrl}/${companionId}`,
        {
          message,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          allowExplicit: this.getAllowExplicit(),
        },
        { headers: this.auth.getAuthHeaders() },
      ),
    );

    return response.response;
  }

  async getHistory(companionId: string): Promise<ChatMessage[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ messages: ChatMessage[] }>(`${this.apiUrl}/${companionId}/history`, {
          headers: this.auth.getAuthHeaders(),
        }),
      );
      return response.messages.map((m: any) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp as string | number) : new Date(),
      }));
    } catch {
      return [];
    }
  }

  async clearHistory(companionId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${companionId}/history`, {
        headers: this.auth.getAuthHeaders(),
      }),
    );
  }

  /**
   * Synthesises speech in the companion's unique voice.
   * @returns an object URL for the audio blob — revoke it after playback.
   */
  async speak(companionId: string, text: string): Promise<string> {
    const blob = await firstValueFrom(
      this.http.post(`${this.apiUrl}/${companionId}/speak`, { text }, {
        responseType: 'blob',
        headers: this.auth.getAuthHeaders(),
      }),
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
    try {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      document.cookie = `${NSFW_OPTIN_KEY}=${allowed}; expires=${date.toUTCString()}; path=/`;
    } catch {
      // ignore (SSR / no document)
    }
  }
}