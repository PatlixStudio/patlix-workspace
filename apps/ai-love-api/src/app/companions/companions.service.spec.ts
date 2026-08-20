import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CompanionGender } from './companion.entity';
import { CompanionsService } from './companions.service';

describe('CompanionsService', () => {
  let service: CompanionsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CompanionsService],
    }).compile();

    service = moduleRef.get(CompanionsService);
  });

  it('seeds exactly 8 female and 6 male companions', () => {
    const females = service.findAll(CompanionGender.Female);
    const males = service.findAll(CompanionGender.Male);
    expect(females).toHaveLength(8);
    expect(males).toHaveLength(6);
  });

  it('filters companions by personality tag (substring, case-insensitive)', () => {
    const romantic = service.findAll(undefined, 'romantic');
    expect(romantic.length).toBeGreaterThan(0);
    expect(
      romantic.every((c) =>
        c.personalityTags.some((t) => t.includes('romantic')),
      ),
    ).toBe(true);
  });

  it('returns a companion by id', () => {
    const ava = service.findOne('ava');
    expect(ava.name).toBe('Ava');
    expect(ava.gender).toBe(CompanionGender.Female);
  });

  it('throws NotFoundException for an unknown id', () => {
    expect(() => service.findOne('nobody')).toThrow(NotFoundException);
  });

  it('every companion is an adult (18+)', () => {
    for (const companion of service.findAll()) {
      expect(companion.age).toBeGreaterThanOrEqual(18);
    }
  });
});