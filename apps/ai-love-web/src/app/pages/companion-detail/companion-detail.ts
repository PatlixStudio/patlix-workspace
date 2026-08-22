import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { switchMap, catchError, of } from 'rxjs';
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

  protected companion: Companion | undefined = undefined;
  protected notFound = false;
  protected loading = true;

  ngOnInit(): void {
    // Safety timeout to avoid infinite loading
    const safetyTimer = setTimeout(() => {
      if (this.loading) {
        console.warn('[CompanionDetail] Safety timeout triggered');
        this.loading = false;
        this.notFound = true;
      }
    }, 5000);

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          console.log('[CompanionDetail] Loading companion:', id);
          return this.api.get(id).pipe(
            catchError((err) => {
              console.error('[CompanionDetail] Error loading companion:', err);
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (companion) => {
          clearTimeout(safetyTimer);
          console.log('[CompanionDetail] Received:', companion);
          this.loading = false;
          if (companion) {
            this.companion = companion;
            this.notFound = false;
          } else {
            this.notFound = true;
          }
        },
        error: (err) => {
          clearTimeout(safetyTimer);
          console.error('[CompanionDetail] Subscribe error:', err);
          this.loading = false;
          this.notFound = true;
        },
      });
  }

  protected avatarUrl(c: Companion): string {
    return `/assets/companions/${c.id}/profile/${c.id}-profile.png`;
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-avatar.png';
  }
}