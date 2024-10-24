import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLog } from '../user-log.schema';
import { ProcessedLog } from '../processed-log.schema';
import * as client from 'prom-client';

@Injectable()
export class QueueService implements OnModuleInit {
  private handlerRegistered = false;

  private jobCounter: client.Counter<string>;
  private jobDurationHistogram: client.Histogram<string>;

  constructor(
    @InjectQueue('user-log-queue') private userLogQueue: Queue,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
    @InjectModel(ProcessedLog.name)
    private processedLogModel: Model<ProcessedLog>,
  ) {
    this.jobCounter = new client.Counter({
      name: 'bull_queue_jobs_total',
      help: 'Total number of jobs processed by Bull Queue',
    });

    this.jobDurationHistogram = new client.Histogram({
      name: 'bull_queue_job_duration_seconds',
      help: 'Duration of Bull Queue jobs in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
  }

  async onModuleInit() {
    this.registerQueueProcessor();
  }

  async addToQueue() {
    try {
      for (let i = 0; i < 100; i++) {
        await this.userLogQueue.add('user-log-job', {});
        console.log(`Job ${i + 1} successfully added to queue`);
      }
      console.log('All jobs successfully added to queue');
    } catch (error) {
      console.error('Error adding job to queue:', error);
    }
  }

  private async registerQueueProcessor() {
    if (this.handlerRegistered) {
      return;
    }

    let processedCount = 0;
    const totalLogsToProcess = 100;

    const globalStartTime = Date.now();

    this.userLogQueue.process('user-log-job', 1, async (job) => {
      const startTime = Date.now();

      let userLog = await this.userLogModel
        .findOne({ isProcessed: false })
        .exec();

      while (userLog && processedCount < totalLogsToProcess) {
        const endTimer = this.jobDurationHistogram.startTimer();

        const processedLog = {
          userId: userLog.userId,
          originalAction: userLog.action,
          processedAction: userLog.action.toUpperCase(),
          timestamp: userLog.timestamp,
        };

        await this.processedLogModel.create(processedLog);

        await this.userLogModel.updateOne(
          { _id: userLog._id },
          { $set: { isProcessed: true } },
        );

        console.log(
          `Bull Worker: Processed and updated log with ID ${userLog._id}.`,
        );

        this.jobCounter.inc();
        endTimer();

        processedCount++;

        userLog = await this.userLogModel
          .findOne({ isProcessed: false })
          .exec();
      }

      if (!userLog) {
        console.log('No more logs to process.');
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`Processed 1 log in ${duration} seconds.`);

      if (processedCount >= totalLogsToProcess) {
        const globalEndTime = Date.now();
        const totalDuration = (globalEndTime - globalStartTime) / 1000;

        console.log(
          `Processed ${totalLogsToProcess} logs in ${totalDuration} seconds.`,
        );
      }
    });

    this.handlerRegistered = true;
  }
}
