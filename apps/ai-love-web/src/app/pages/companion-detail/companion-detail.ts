import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { Companion } from '../../core/models/companion';
import { CompanionsApiService } from '../../core/services/companions-api.service';

/**
 * Detail page for a single companion profile.
 */
@Component({
  selector: 'app-companion-detail',
  imports: [
    RouterLink,
    MatButton,
    MatCard,
    MatCardContent,
    MatChip,
    MatChipsModule,
    MatIcon,
    MatProgressSpinner,
  ],
  templateUrl: './companion-detail.html',
  styleUrl: './companion-detail.scss',
})
export class CompanionDetailComponent implements OnInit {
  private readonly api = inject(CompanionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  protected companion: Companion | undefined = undefined;
  protected notFound = false;
  protected loading = true;

  ngOnInit(): void {
    // Get companion ID from route
    const companionId = this.route.snapshot.paramMap.get('id');
    console.log('[CompanionDetail] Component initialized, id:', companionId);

    if (!companionId) {
      console.error('[CompanionDetail] No companion ID in route');
      this.loading = false;
      this.notFound = true;
      this.cdr.detectChanges();
      return;
    }

    // Load companion data
    this.loadCompanion(companionId);
  }

  private async loadCompanion(id: string): Promise<void> {
    console.log('[CompanionDetail] Starting API call for:', id);

    // Safety timeout
    const timeout = setTimeout(() => {
      console.warn('[CompanionDetail] Timeout - forcing notFound');
      this.loading = false;
      this.notFound = true;
      this.cdr.detectChanges();
    }, 5000);

    try {
      const companion = await firstValueFrom(this.api.get(id));
      clearTimeout(timeout);

      console.log('[CompanionDetail] Received:', companion);

      if (companion) {
        this.companion = companion;
        this.loading = false;
        this.notFound = false;
        console.log('[CompanionDetail] Companion set, loading finished');
      } else {
        this.loading = false;
        this.notFound = true;
        console.log('[CompanionDetail] Companion null, showing notFound');
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[CompanionDetail] Error:', err);
      this.loading = false;
      this.notFound = true;
    }

    // Force change detection
    this.cdr.detectChanges();
  }

  protected avatarUrl(c: Companion): string {
    return `/assets/companions/${c.id}/profile/${c.id}-profile.png`;
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-avatar.png';
  }
}