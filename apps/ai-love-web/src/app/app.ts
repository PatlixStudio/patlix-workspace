import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { NSFW_OPTIN_KEY } from './core/models/companion';

/**
 * App shell: brand header + router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterModule, MatIconButton, MatIcon, MatTooltip],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected hideNav = false;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.hideNav = event.urlAfterRedirects === '/age-gate';
      });
  }

  /** Whether explicit content is opted in (shown in the header badge). */
  protected nsfwOptedIn(): boolean {
    return document.cookie.match(new RegExp(`(^| )${NSFW_OPTIN_KEY}=([^;]+)`))?.[2] === 'true';
  }
}