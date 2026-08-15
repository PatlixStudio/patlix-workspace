import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

/** Generic placeholder page shown for not-yet-built dashboard sections. */
@Component({
  selector: 'app-placeholder-page',
  imports: [MatIcon],
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.scss',
})
export class PlaceholderPageComponent {
  protected title = 'Page';

  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  constructor() {
    const label = this.route.snapshot.data['label'];
    if (label) {
      this.title = label;
      this.titleService.setTitle(`${label} — Aurel AI Command Center`);
    }
  }
}