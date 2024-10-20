import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from './kafka/kafka.module';
import { QueueModule } from './queue/queue.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { UserLog, UserLogSchema } from './user-log.schema';
import { ProcessedLog, ProcessedLogSchema } from './processed-log.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule을 글로벌로 설정하여 모든 모듈에서 접근 가능
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          // configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/test',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: UserLog.name, schema: UserLogSchema }]),
    MongooseModule.forFeature([
      { name: ProcessedLog.name, schema: ProcessedLogSchema },
    ]),
    KafkaModule,
    QueueModule,
  ],
  providers: [SeedService],
  controllers: [SeedController],
})
export class AppModule {}
