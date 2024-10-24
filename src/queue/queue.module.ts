import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueService } from './queue.service';
import { UserLog, UserLogSchema } from '../user-log.schema';
import { ProcessedLog, ProcessedLogSchema } from '../processed-log.schema';
import { QueueController } from './queue.controller';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserLog.name, schema: UserLogSchema },
      { name: ProcessedLog.name, schema: ProcessedLogSchema },
    ]),
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'user-log-queue',
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues', // Bull Board 대시보드 경로
      adapter: ExpressAdapter, // Express 어댑터 사용
    }),
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
