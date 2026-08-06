import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthResponseDto, AuthUser, UserDto } from '@patlix/shared';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

/**
 * Handles authentication: login, registration and JWT issuance.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates credentials and returns a JWT access token.
   * @throws UnauthorizedException when the credentials are invalid
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse(user);
  }

  /**
   * Registers a new user and returns a JWT access token.
   * @throws ConflictException when the email is already taken
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create(email, dto.name, passwordHash);
    return this.buildAuthResponse(user);
  }

  /**
   * Returns the public profile of the user with the given id.
   * @throws UnauthorizedException when the user no longer exists
   */
  async profile(id: number): Promise<UserDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toUserDto(user);
  }

  /**
   * Maps a persisted user to the public DTO shape.
   */
  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Builds the auth response containing a signed JWT for the given user.
   */
  private buildAuthResponse(user: User): AuthResponseDto {
    const payload: AuthUser = { id: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toUserDto(user),
    };
  }
}
