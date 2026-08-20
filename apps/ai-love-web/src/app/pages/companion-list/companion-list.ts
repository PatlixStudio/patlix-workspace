import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { Companion, CompanionGender } from '../../core/models/companion';
import { CompanionsApiService } from '../../core/services/companions-api.service';
import { CompanionCardComponent } from './companion-card';

/**
 * Catalog page: grids all companions with gender and personality-tag filters.
 */
@Component({
  selector: 'app-companion-list',
  imports: [
    AsyncPipe,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatChip,
    MatChipsModule,
    MatProgressSpinner,
    CompanionCardComponent,
  ],
  templateUrl: './companion-list.html',
  styleUrl: './companion-list.scss',
})
export class CompanionListComponent implements OnInit {
  private readonly api = inject(CompanionsApiService);

  protected gender: CompanionGender | undefined = undefined;
  protected selectedTag: string | undefined = undefined;
  protected companions$: Observable<Companion[]> = this.api.list();
  protected tags: string[] = [];

  ngOnInit(): void {
    this.api.personalityTags().subscribe((tags) => {
      this.tags = tags;
    });
  }

  /** Toggles a personality-tag filter. */
  protected toggleTag(tag: string): void {
    this.selectedTag = this.selectedTag === tag ? undefined : tag;
    this.applyFilters();
  }

  /** Applies the current gender + tag filters. */
  protected applyFilters(): void {
    this.companions$ = this.api.list(this.gender, this.selectedTag);
  }

  protected readonly CompanionGender = CompanionGender;
}