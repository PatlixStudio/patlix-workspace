/**
 * Gender of a companion profile.
 */
export enum CompanionGender {
  /** Female-presenting companion. */
  Female = 'female',
  /** Male-presenting companion. */
  Male = 'male',
}

/**
 * A single AI companion profile served to the ai-love dashboard.
 *
 * Avatars are placeholders: a Google Material symbol icon name plus a
 * tonal color, so no image assets are required for this milestone.
 */
export class Companion {
  /** Stable identifier, e.g. `ava` or `leo`. */
  id!: string;
  /** Display name. */
  name!: string;
  /** Last name / surname. */
  surname!: string;
  /** Presented age (18+). */
  age!: number;
  /** Gender bucket used by the catalog filters. */
  gender!: CompanionGender;
  /** Short persona summary shown on cards. */
  tagline!: string;
  /** Longer persona / backstory shown on the detail page. */
  persona!: string;
  /** Personality keywords, used for search/filter chips. */
  personalityTags!: string[];
  /** Hobbies / interests, shown on the detail page. */
  interests!: string[];
  /** Google Material symbol used as the placeholder avatar. */
  avatarIcon!: string;
  /** Tonal palette key used to tint the avatar chip. */
  avatarTone!: string;
  /** Tone of voice for future chat integration. */
  tone!: string;
  /** TTS voice id (Speaches/Kokoro) used for this companion's spoken replies. */
  voice!: string;
  /** Whether this companion can engage in mature topics (gated by the 18+ flow). */
  nsfw!: boolean;
}