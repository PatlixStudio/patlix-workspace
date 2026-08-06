import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AuthResponseDto, UserDto } from '@patlix/shared';

const TOKEN_KEY = 'patlix_access_token';

/**
 * Manages authentication state, the JWT access token and the current user.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<UserDto | null>(null);

  /** Currently authenticated user, or null. */
  readonly user = this.userSignal.asReadonly();

  /** True when a user is loaded. */
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /** The stored JWT access token, or null. */
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Authenticates with email + password and stores the session.
   */
  async login(email: string, password: string): Promise<AuthResponseDto> {
    const response = await firstValueFrom(
      this.http.post<AuthResponseDto>('/api/auth/login', { email, password }),
    );
    this.saveSession(response);
    return response;
  }

  /**
   * Restores the session on app start when a token is present.
   */
  async restoreSession(): Promise<void> {
    if (!this.token) {
      return;
    }
    try {
      const user = await firstValueFrom(
        this.http.get<UserDto>('/api/auth/me'),
      );
      this.userSignal.set(user);
    } catch {
      this.clearSession();
    }
  }

  /**
   * Clears the session and redirects to the login page.
   */
  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /**
   * Persists the token and user after a successful login.
   */
  private saveSession(response: AuthResponseDto): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    this.userSignal.set(response.user);
  }

  /**
   * Removes the token and the in-memory user.
   */
  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSignal.set(null);
  }
}
