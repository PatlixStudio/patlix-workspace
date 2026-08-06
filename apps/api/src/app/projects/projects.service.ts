import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProjectDto } from '@patlix/shared';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

/**
 * Business logic for workspace projects.
 */
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  /** Returns all projects ordered by most recently updated first. */
  async findAll(): Promise<ProjectDto[]> {
    const projects = await this.projectsRepository.find({
      order: { updatedAt: 'DESC' },
    });
    return projects.map((project) => this.toDto(project));
  }

  /** Returns a single project by id. */
  async findOne(id: number): Promise<ProjectDto> {
    return this.toDto(await this.findEntity(id));
  }

  /** Creates a new project. */
  async create(dto: CreateProjectDto): Promise<ProjectDto> {
    const project = this.projectsRepository.create(dto);
    return this.toDto(await this.projectsRepository.save(project));
  }

  /** Updates an existing project by id. */
  async update(id: number, dto: UpdateProjectDto): Promise<ProjectDto> {
    const project = await this.findEntity(id);
    this.projectsRepository.merge(project, dto);
    return this.toDto(await this.projectsRepository.save(project));
  }

  /** Deletes a project by id. */
  async remove(id: number): Promise<void> {
    const project = await this.findEntity(id);
    await this.projectsRepository.remove(project);
  }

  /**
   * Loads the raw entity or throws when it does not exist.
   */
  private async findEntity(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  /**
   * Maps a persisted project to the public DTO shape.
   */
  private toDto(project: Project): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      repoUrl: project.repoUrl,
      status: project.status,
      tags: project.tags,
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
