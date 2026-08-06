import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Root endpoint with basic API metadata.
 */
@ApiTags('meta')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Returns basic API metadata. */
  @Get()
  @ApiOperation({ summary: 'API metadata' })
  @ApiResponse({ status: 200, description: 'Basic API info' })
  getData() {
    return this.appService.getData();
  }
}
