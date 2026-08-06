import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

/**
 * Body for updating a project. All fields are optional.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
