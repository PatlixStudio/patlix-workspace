/**
 * Gender of a companion profile, matching the API enum.
 */
export enum CompanionGender {
  Female = 'female',
  Male = 'male',
}

/**
 * A companion profile as returned by the ai-love API.
 */
export interface Companion {
  /** Stable identifier, e.g. `ava`. */
  id: string;
  /** Display name. */
  name: string;
  /** Presented age (18+). */
  age: number;
  /** Gender bucket used by the catalog filters. */
  gender: CompanionGender;
  /** Short persona summary shown on cards. */
  tagline: string;
  /** Longer persona / backstory shown on the detail page. */
  persona: string;
  /** Personality keywords, used for filter chips. */
  personalityTags: string[];
  /** Hobbies / interests. */
  interests: string[];
  /** Google Material symbol used as the placeholder avatar. */
  avatarIcon: string;
  /** Tonal palette key used to tint the avatar chip. */
  avatarTone: string;
  /** Tone of voice for future chat integration. */
  tone: string;
  /** Whether this companion can engage in mature topics (18+ gated). */
  nsfw: boolean;
}

/** LocalStorage key holding the 18+ consent flag. */
export const AGE_GATE_KEY = 'ai-love.age-gate.v1';
/** LocalStorage key holding the explicit-content opt-in flag. */
export const NSFW_OPTIN_KEY = 'ai-love.nsfw-optin.v1';