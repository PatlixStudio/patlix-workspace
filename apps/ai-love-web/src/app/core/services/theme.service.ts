import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'ai-love.theme.v1';

/**
 * Light/dark theme state. Applies the choice as `data-theme` on `<html>`
 * and persists it in localStorage; defaults to the OS preference.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.restore());

  /** Current theme mode. */
  readonly mode = this._mode.asReadonly();

  /** Convenience flag for icon/label bindings. */
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    this.apply(this._mode());
  }

  /** Toggles between light and dark. */
  toggle(): void {
    this.set(this._mode() === 'dark' ? 'light' : 'dark');
  }

  /** Sets an explicit theme mode and persists it. */
  set(mode: ThemeMode): void {
    this._mode.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // storage unavailable — session-only theme
    }
  }

  private restore(): ThemeMode {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  private apply(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }
}
