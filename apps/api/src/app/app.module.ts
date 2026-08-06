import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { SeedService } from './seed/seed.service';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';

/**
 * Root module of patlix-api.
 * Loads configuration, connects to PostgreSQL and wires feature modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'patlix',
      password: process.env.DB_PASSWORD ?? 'patlix',
      database: process.env.DB_NAME ?? 'patlix',
      entities: [User, Project],
      // Development only: auto-create/update the schema.
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TypeOrmModule.forFeature([User, Project]),
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
