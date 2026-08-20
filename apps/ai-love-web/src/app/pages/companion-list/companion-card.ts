import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { Companion } from '../../core/models/companion';

/**
 * Card preview for a single companion profile.
 */
@Component({
  selector: 'app-companion-card',
  imports: [
    RouterLink,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatChip,
    MatChipsModule,
  ],
  templateUrl: './companion-card.html',
  styleUrl: './companion-card.scss',
})
export class CompanionCardComponent {
  /** The companion to display. */
  readonly companion = input.required<Companion>();

  protected readonly avatarTone = (tone: string): string => tone;
}