import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanionsModule } from './companions/companions.module';

@Module({
  imports: [CompanionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}