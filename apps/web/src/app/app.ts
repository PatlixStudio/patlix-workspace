import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/auth/auth.service';

/**
 * Application shell: global toolbar and routed content.
 */
@Component({
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  selector: 'patlix-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);

  /** Authenticated user, or null. */
  protected readonly user = this.auth.user;

  constructor() {
    void this.auth.restoreSession();
  }

  /** Logs the current user out. */
  protected logout(): void {
    this.auth.logout();
  }
}
