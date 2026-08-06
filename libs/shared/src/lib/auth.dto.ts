/**
 * @file Shared auth DTOs.
 * Contracts for authentication requests/responses on the patlix platform.
 */

import type { UserDto } from './user.dto';

/**
 * Payload of a login request (email + password).
 */
export interface LoginRequestDto {
  /** Registered account email. */
  email: string;
  /** Plain-text password. */
  password: string;
}

/**
 * Payload of a registration request.
 */
export interface RegisterRequestDto {
  /** Unique email for the new account. */
  email: string;
  /** Display name. */
  name: string;
  /** Plain-text password. */
  password: string;
}

/**
 * Successful authentication response containing a JWT access token
 * and the authenticated user.
 */
export interface AuthResponseDto {
  /** JWT bearer token used for protected endpoints. */
  accessToken: string;
  /** Authenticated user details. */
  user: UserDto;
}

/**
 * Minimal shape of the authenticated principal attached to requests.
 */
export interface AuthUser {
  /** Database id of the user. */
  id: number;
  /** Email of the user. */
  email: string;
}
