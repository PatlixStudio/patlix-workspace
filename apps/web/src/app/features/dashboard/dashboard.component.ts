import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { ProjectDto, ProjectStatus } from '@patlix/shared';
/**
 * Dashboard: greets the user and lists all workspace projects.
 */
@Component({
  imports: [
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  selector: 'patlix-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);

  /** All workspace projects. */
  protected readonly projects = signal<ProjectDto[]>([]);

  /** True while projects are loading. */
  protected readonly loading = signal(true);

  /** Human-readable error message, or null. */
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.loadProjects();
  }

  /**
   * Fetches the project list from the API.
   */
  private async loadProjects(): Promise<void> {
    try {
      const projects = await firstValueFrom(
        this.http.get<ProjectDto[]>('/api/projects'),
      );
      this.projects.set(projects);
    } catch {
      this.error.set('Failed to load projects. Is the API running?');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Human-friendly label for a project status.
   */
  protected statusLabel(status: ProjectStatus): string {
    return status.replace('_', ' ');
  }
}
