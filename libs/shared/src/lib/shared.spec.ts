import { describe, expect, it } from 'vitest';
import { ProjectStatus, UserRole } from '../index';

describe('shared DTO contracts', () => {
  it('defines the project status enum values', () => {
    expect(ProjectStatus).toMatchObject({
      ACTIVE: 'active',
      IN_PROGRESS: 'in_progress',
      PLANNED: 'planned',
      ARCHIVED: 'archived',
    });
  });

  it('defines the user role enum values', () => {
    expect(UserRole).toMatchObject({
      ADMIN: 'admin',
      USER: 'user',
    });
  });
});
