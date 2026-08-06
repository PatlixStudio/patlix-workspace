import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { RegisterRequestDto } from '@patlix/shared';

/**
 * Body of the registration endpoint.
 */
export class RegisterDto implements RegisterRequestDto {
  /** Unique email for the new account. */
  @ApiProperty({ example: 'patlix@patlix.dev' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  /** Display name. */
  @ApiProperty({ example: 'Patlix User' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  /** Plain-text password (min 6 chars). */
  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password!: string;
}
