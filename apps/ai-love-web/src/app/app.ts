import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NSFW_OPTIN_KEY } from './core/models/companion';

/**
 * App shell: brand header + router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

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
    return localStorage.getItem(NSFW_OPTIN_KEY) === 'true';
  }
}