import { Injectable, NotFoundException } from '@nestjs/common';
import { Companion, CompanionGender } from './companion.entity';
import { COMPANIONS } from './companion.data';

/**
 * Provides read access to the seeded companion catalog.
 *
 * Stateless in this milestone: data lives in `companion.data.ts`. When chat /
 * persistence is introduced, this service can be backed by TypeORM without
 * changing the controller contract.
 */
@Injectable()
export class CompanionsService {
  /**
   * Returns all companions, optionally filtered by gender and by a
   * personality tag substring.
   *
   * @param gender optional gender filter
   * @param tag optional personality-tag filter (case-insensitive, substring)
   */
  findAll(gender?: CompanionGender, tag?: string): Companion[] {
    let result = COMPANIONS;
    if (gender) {
      result = result.filter((c) => c.gender === gender);
    }
    if (tag) {
      const needle = tag.toLowerCase();
      result = result.filter((c) =>
        c.personalityTags.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    return result;
  }

  /**
   * Returns a single companion by id.
   *
   * @param id companion id (e.g. `ava`)
   * @throws NotFoundException when the id is unknown
   */
  findOne(id: string): Companion {
    const companion = COMPANIONS.find((c) => c.id === id);
    if (!companion) {
      throw new NotFoundException(`Companion "${id}" not found`);
    }
    return companion;
  }
}