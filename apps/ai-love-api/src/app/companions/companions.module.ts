import { Module } from '@nestjs/common';
import { CompanionsController } from './companions.controller';
import { CompanionsService } from './companions.service';

/**
 * Companion catalog module: seeded profiles served over REST.
 */
@Module({
  controllers: [CompanionsController],
  providers: [CompanionsService],
  exports: [CompanionsService],
})
export class CompanionsModule {}