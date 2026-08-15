import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

/**
 * Manages the light/dark theme. The active mode is persisted to
 * localStorage and reflected as a `theme-dark` / `theme-light` class
 * on the document root.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'aurel-theme';
  readonly mode = signal<ThemeMode>(this.readInitial());

  constructor() {
    this.apply(this.mode());
  }

  /** Toggles between dark and light. */
  toggle(): void {
    this.apply(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): ThemeMode {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      /* localStorage unavailable — fall through */
    }
    return 'dark';
  }

  private apply(mode: ThemeMode): void {
    this.mode.set(mode);
    document.documentElement.classList.toggle('theme-dark', mode === 'dark');
    document.documentElement.classList.toggle('theme-light', mode === 'light');
    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      /* non-persistent session */
    }
  }
}