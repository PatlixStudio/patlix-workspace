import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  isSubscribed: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

const TOKEN_KEY = 'ai-love.jwt-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';

  private readonly _user = signal<UserProfile | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor() {
    // Try to restore session from cookie
    const token = this.getCookie(TOKEN_KEY);
    if (token) {
      this._token.set(token);
      this.fetchMe();
    }
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    surname: string;
  }): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/register`, data)
    );
    this.setSession(res);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
    );
    this.setSession(res);
    return res;
  }

  async logout(): Promise<void> {
    this._user.set(null);
    this._token.set(null);
    document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }

  private async fetchMe(): Promise<void> {
    const token = this._token();
    if (!token) return;
    try {
      const user = await firstValueFrom(
        this.http.get<UserProfile>(`${this.baseUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      this._user.set(user);
    } catch {
      this.logout();
    }
  }

  private setSession(res: AuthResponse): void {
    this._user.set(res.user);
    this._token.set(res.token);
    // Set cookie for persistence (1 week)
    const date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `${TOKEN_KEY}=${res.token}; expires=${date.toUTCString()}; path=/`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this._token();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}