import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '@patlix/shared';

/**
 * A workspace project shown on the patlix-web dashboard launcher.
 */
@Entity('projects')
export class Project {
  /** Unique auto-generated id. */
  @PrimaryGeneratedColumn()
  id!: number;

  /** Human-friendly display name, e.g. "patlix-web". */
  @Column()
  name!: string;

  /** URL-safe unique slug. */
  @Column({ unique: true })
  slug!: string;

  /** Short description shown on the project card. */
  @Column({ type: 'text' })
  description!: string;

  /** Link to the project's own repository. */
  @Column({ default: '' })
  repoUrl!: string;

  /** Lifecycle state of the project. */
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNED })
  status!: ProjectStatus;

  /** Free-form tags (Postgres text[]). */
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  /** ISO timestamp of creation. */
  @CreateDateColumn()
  createdAt!: Date;

  /** ISO timestamp of the last update. */
  @UpdateDateColumn()
  updatedAt!: Date;
}
