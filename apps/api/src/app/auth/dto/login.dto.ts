import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { LoginRequestDto } from '@patlix/shared';

/**
 * Body of the login endpoint.
 */
export class LoginDto implements LoginRequestDto {
  /** Registered account email. */
  @ApiProperty({ example: 'admin@patlix.dev' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  /** Plain-text password. */
  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
