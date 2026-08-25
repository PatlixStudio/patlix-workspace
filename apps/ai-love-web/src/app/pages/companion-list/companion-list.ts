import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { Companion, CompanionGender } from '../../core/models/companion';
import { CompanionsApiService } from '../../core/services/companions-api.service';
import { CompanionCardComponent } from './companion-card';

/**
 * Catalog page: grids all companions with gender filter pills.
 */
@Component({
  selector: 'app-companion-list',
  imports: [AsyncPipe, MatProgressSpinner, CompanionCardComponent],
  templateUrl: './companion-list.html',
  styleUrl: './companion-list.scss',
})
export class CompanionListComponent {
  private readonly api = inject(CompanionsApiService);

  protected readonly genders: Array<{ value: CompanionGender | undefined; label: string }> = [
    { value: undefined, label: 'All' },
    { value: CompanionGender.Female, label: 'She' },
    { value: CompanionGender.Male, label: 'He' },
  ];

  protected selectedGender: CompanionGender | undefined = undefined;
  protected companions$: Observable<Companion[]> = this.api.list();

  /** Selects a gender pill and refreshes the catalog. */
  protected selectGender(gender: CompanionGender | undefined): void {
    this.selectedGender = gender;
    this.companions$ = this.api.list(gender, undefined);
  }

  protected readonly CompanionGender = CompanionGender;
}
