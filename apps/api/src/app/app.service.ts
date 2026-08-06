import { Injectable } from '@nestjs/common';

/**
 * Provides basic API metadata.
 */
@Injectable()
export class AppService {
  getData(): { name: string; docs: string; version: string } {
    return {
      name: 'patlix-api',
      docs: '/api/docs',
      version: '1.0.0',
    };
  }
}
