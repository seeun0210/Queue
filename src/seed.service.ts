import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLog } from './user-log.schema';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(UserLog.name) private readonly userLogModel: Model<UserLog>,
  ) {}

  async insertTestData() {
    this.logger.log('Inserting 10,000 user log entries into MongoDB...');

    const testData = [];
    for (let i = 0; i < 10000; i++) {
      testData.push({
        userId: `user-${i + 1}`,
        action: `action-${i + 1}`,
        timestamp: new Date(),
        isProcessed: false,
      });
    }

    await this.userLogModel.insertMany(testData);
    this.logger.log('Insertion complete.');
  }
}
