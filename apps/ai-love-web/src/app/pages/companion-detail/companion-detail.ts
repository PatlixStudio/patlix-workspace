import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';
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

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((params) => this.api.get(params.get('id') ?? '')))
      .subscribe({
        next: (companion) => {
          this.companion = companion;
        },
        error: () => {
          this.notFound = true;
        },
      });
  }
}