import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '@patlix/shared';

/**
 * Application user able to authenticate against patlix-api.
 */
@Entity('users')
export class User {
  /** Unique auto-generated id. */
  @PrimaryGeneratedColumn()
  id!: number;

  /** Unique account email used for login. */
  @Column({ unique: true })
  email!: string;

  /** Display name. */
  @Column()
  name!: string;

  /** Bcrypt hash of the password. Never exposed via the API. */
  @Column()
  passwordHash!: string;

  /** Role determining permissions (admin/user). */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  /** ISO timestamp of account creation. */
  @CreateDateColumn()
  createdAt!: Date;
}
