import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@patlix/shared';
import { User } from '../entities/user.entity';

/**
 * Data access for application users.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by their email address.
   * @param email account email to look up
   * @returns the user or null when not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Finds a user by their database id.
   * @param id user id
   * @returns the user or null when not found
   */
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Creates a new user.
   * @param email unique account email
   * @param name display name
   * @param passwordHash pre-hashed password
   * @param role optional role, defaults to USER
   */
  async create(
    email: string,
    name: string,
    passwordHash: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const user = this.usersRepository.create({ email, name, passwordHash, role });
    return this.usersRepository.save(user);
  }
}
