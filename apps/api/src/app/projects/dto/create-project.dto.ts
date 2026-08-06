import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ProjectStatus } from '@patlix/shared';
import type { ProjectDto } from '@patlix/shared';

/**
 * Body for creating a project.
 */
export class CreateProjectDto implements Partial<ProjectDto> {
  /** Display name. */
  @ApiProperty({ example: 'patlix-web' })
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  name!: string;

  /** URL-safe unique slug. */
  @ApiProperty({ example: 'patlix-web' })
  @IsString()
  @MinLength(2, { message: 'slug must be at least 2 characters long' })
  slug!: string;

  /** Short description. */
  @ApiPropertyOptional({ example: 'Angular dashboard for the Patlix workspace' })
  @IsString()
  @IsOptional()
  description?: string;

  /** Repository link. */
  @ApiPropertyOptional({ example: 'https://github.com/PatlixStudio/patlix-web' })
  @IsString()
  @IsOptional()
  repoUrl?: string;

  /** Lifecycle state. */
  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNED })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  /** Free-form tags. */
  @ApiPropertyOptional({ type: [String], example: ['angular', 'dashboard'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
