import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);

  readonly user = this.auth.user;

  get explicitOn(): boolean {
    return this.chatService.isExplicitAllowed();
  }

  goCompanions(): void {
    void this.router.navigate(['/companions']);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigate(['/companions']);
  }

  toggleExplicit(event: { checked: boolean }): void {
    if (!this.auth.isPremium()) return;
    this.chatService.setExplicitAllowed(event.checked);
  }

  async subscribe(): Promise<void> {
    try {
      await this.auth.subscribe();
    } catch (err: any) {
      alert(err?.error?.message ?? 'Subscription failed. Please log in first.');
    }
  }
}