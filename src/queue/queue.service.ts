import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLog } from '../user-log.schema';
import { ProcessedLog } from '../processed-log.schema';

@Injectable()
export class QueueService implements OnModuleInit {
  private handlerRegistered = false;

  constructor(
    @InjectQueue('user-log-queue') private userLogQueue: Queue,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
    @InjectModel(ProcessedLog.name)
    private processedLogModel: Model<ProcessedLog>,
  ) {}

  async onModuleInit() {
    // Queue 프로세서 등록
    this.registerQueueProcessor();
  }

  async addToQueue() {
    await this.userLogQueue.add('user-log-job', {});
  }

  private registerQueueProcessor() {
    if (this.handlerRegistered) {
      return;
    }

    this.userLogQueue.process('user-log-job', 3, async (job) => {
      // UserLog 데이터 조회
      const userLogs = await this.userLogModel.find().limit(10000).exec();

      // 로그 처리 및 저장
      const processedLogs = userLogs.map((log) => ({
        userId: log.userId,
        originalAction: log.action,
        processedAction: log.action.toUpperCase(),
        timestamp: log.timestamp,
      }));

      await this.processedLogModel.insertMany(processedLogs);
      console.log(
        `Bull Worker: Processed and saved ${processedLogs.length} logs to ProcessedLog schema`,
      );
    });

    this.handlerRegistered = true;
  }
}
