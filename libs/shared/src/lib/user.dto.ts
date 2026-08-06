/**
 * @file Shared user DTOs.
 * Single source of truth for user-related data contracts used by both
 * patlix-api (NestJS) and patlix-web (Angular).
 */

/**
 * Role of a user in the patlix system.
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Public representation of a user returned by the API.
 * Never includes the password hash.
 */
export interface UserDto {
  /** Unique database id. */
  id: number;
  /** Unique, lowercase email used to authenticate. */
  email: string;
  /** Display name. */
  name: string;
  /** Role determining permissions. */
  role: UserRole;
  /** ISO-8601 timestamp of account creation. */
  createdAt: string;
}
