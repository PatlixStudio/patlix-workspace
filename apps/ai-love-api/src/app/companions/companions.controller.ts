import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Companion, CompanionGender } from './companion.entity';
import { CompanionsService } from './companions.service';

/**
 * REST API for the companion catalog.
 */
@ApiTags('companions')
@Controller('companions')
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}

  /**
   * Lists all companions, optionally filtered by gender and personality tag.
   *
   * @param gender filter by `female` / `male`
   * @param tag filter by a personality-tag substring (e.g. `romantic`)
   */
  @Get()
  @ApiOperation({ summary: 'List companions with optional filters' })
  @ApiQuery({ name: 'gender', required: false, enum: CompanionGender })
  @ApiQuery({ name: 'tag', required: false })
  findAll(
    @Query('gender') gender?: CompanionGender,
    @Query('tag') tag?: string,
  ): Companion[] {
    return this.companionsService.findAll(gender, tag);
  }

  /**
   * Returns a single companion by id.
   *
   * @param id companion id, e.g. `ava`
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get one companion by id' })
  findOne(@Param('id') id: string): Companion {
    return this.companionsService.findOne(id);
  }
}