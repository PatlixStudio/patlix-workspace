import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { AGE_GATE_KEY, NSFW_OPTIN_KEY } from '../../core/models/companion';

/**
 * 18+ consent gate shown before any companion content.
 */
@Component({
  selector: 'app-age-gate',
  imports: [FormsModule, MatButton, MatCheckbox],
  templateUrl: './age-gate.html',
  styleUrl: './age-gate.scss',
})
export class AgeGateComponent {
  private readonly router = inject(Router);
  protected nsfwOptIn = false;

  /** Persists the 18+ consent and (optionally) the explicit-content opt-in via cookies. */
  protected confirmAge(): void {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1); // 1 year expiry
    const cookieString = `${AGE_GATE_KEY}=true; expires=${date.toUTCString()}; path=/`;
    document.cookie = cookieString;
    const nsfwCookieString = `${NSFW_OPTIN_KEY}=${this.nsfwOptIn ? 'true' : 'false'}; expires=${date.toUTCString()}; path=/`;
    document.cookie = nsfwCookieString;
    void this.router.navigate(['/companions']);
  }
}