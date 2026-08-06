import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ProjectStatus, UserRole } from '@patlix/shared';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';

/**
 * Seeds the development database with a default admin user and the
 * initial set of workspace projects so the dashboard has content.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Project) private readonly projectsRepository: Repository<Project>,
  ) {}

  /** Runs once after the application bootstraps. */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
    await this.seedProjects();
  }

  /**
   * Creates the default admin account when no user exists.
   */
  private async seedAdminUser(): Promise<void> {
    const count = await this.usersRepository.count();
    if (count > 0) {
      return;
    }

    const email = this.configService.get<string>('SEED_ADMIN_EMAIL', 'admin@patlix.dev');
    const password = this.configService.get<string>('SEED_ADMIN_PASSWORD', 'admin123');
    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        name: 'Patlix Admin',
        passwordHash,
        role: UserRole.ADMIN,
      }),
    );
    this.logger.log(`Seeded admin user ${email} (password: ${password})`);
  }

  /**
   * Seeds the initial workspace projects when the table is empty.
   */
  private async seedProjects(): Promise<void> {
    const count = await this.projectsRepository.count();
    if (count > 0) {
      return;
    }

    const projects = this.projectsRepository.create([
      {
        name: 'patlix-web',
        slug: 'patlix-web',
        description: 'Main dashboard app: login and launch all workspace projects.',
        repoUrl: 'https://github.com/PatlixStudio/patlix-web',
        status: ProjectStatus.IN_PROGRESS,
        tags: ['angular', 'material-m3', 'dashboard'],
      },
      {
        name: 'patlix-api',
        slug: 'patlix-api',
        description: 'NestJS REST API with Swagger docs, JWT auth and PostgreSQL.',
        repoUrl: 'https://github.com/PatlixStudio/patlix-api',
        status: ProjectStatus.IN_PROGRESS,
        tags: ['nestjs', 'postgres', 'typeorm'],
      },
      {
        name: 'patlix-shared',
        slug: 'patlix-shared',
        description: 'Shared DTOs and types used by both web and api.',
        repoUrl: 'https://github.com/PatlixStudio/patlix-shared',
        status: ProjectStatus.ACTIVE,
        tags: ['typescript', 'dto'],
      },
      {
        name: 'arkadion',
        slug: 'arkadion',
        description: 'AI assistant project with chat personas and local models.',
        repoUrl: '',
        status: ProjectStatus.ACTIVE,
        tags: ['nestjs', 'angular', 'ai'],
      },
      {
        name: 'ai-dashboard',
        slug: 'ai-dashboard',
        description: 'Personalized AI assistant dashboard (UX design pending).',
        repoUrl: '',
        status: ProjectStatus.PLANNED,
        tags: ['ai', 'dashboard', 'ux-driven'],
      },
    ]);

    await this.projectsRepository.save(projects);
    this.logger.log(`Seeded ${projects.length} workspace projects`);
  }
}
