// seed.controller.ts
import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('insert')
  async insertTestData() {
    await this.seedService.insertTestData();
    return { message: 'Inserted 10,000 user logs successfully' };
  }
}
