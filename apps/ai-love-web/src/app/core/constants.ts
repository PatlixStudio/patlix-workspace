import { CompanionGender } from './models/companion';

/**
 * Core constants for ai-love project.
 * Keeps magic values in one place for easy maintenance.
 */
export const COMPANION_GENDER_OPTIONS = [
  { value: CompanionGender.Female, label: 'She' },
  { value: CompanionGender.Male, label: 'He' },
] as const;

/**
 * Age gate localStorage keys.
 */
export const AGE_GATE_KEYS = {
  CONSENT: 'ai-love.age-gate.v1',
  NSFW_OPTIN: 'ai-love.nsfw-optin.v1',
} as const;

/**
 * UI configuration constants.
 */
export const UI_CONSTANTS = {
  MAX_COMPANIONS_DISPLAYED: 14,
  DEFAULT_AVATAR_SIZE: 120,
  FILTER_DEBOUNCE_MS: 300,
} as const;