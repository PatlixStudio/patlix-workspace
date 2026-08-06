/**
 * @file Shared project DTOs.
 * Contracts for workspace projects shown on the patlix-web dashboard.
 */

/**
 * Lifecycle state of a workspace project.
 */
export enum ProjectStatus {
  /** Fully built and usable. */
  ACTIVE = 'active',
  /** Currently being developed. */
  IN_PROGRESS = 'in_progress',
  /** Scheduled, not yet started. */
  PLANNED = 'planned',
  /** No longer maintained. */
  ARCHIVED = 'archived',
}

/**
 * A workspace project as listed on the dashboard launcher.
 */
export interface ProjectDto {
  /** Unique database id. */
  id: number;
  /** Human-friendly display name, e.g. "patlix-web". */
  name: string;
  /** URL-safe unique slug, e.g. "patlix-web". */
  slug: string;
  /** Short description shown on the project card. */
  description: string;
  /** Link to the project's own repository. */
  repoUrl: string;
  /** Current lifecycle state. */
  status: ProjectStatus;
  /** Free-form tags, e.g. "angular", "dashboard". */
  tags: string[];
  /** ISO-8601 timestamp of the last update. */
  updatedAt: string;
}
