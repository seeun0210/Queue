import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Kafka, Partitioners } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { UserLog, UserLogSchema } from '../user-log.schema';
import { ProcessedLog, ProcessedLogSchema } from '../processed-log.schema';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // MongoDB 스키마 등록
    MongooseModule.forFeature([
      { name: UserLog.name, schema: UserLogSchema },
      { name: ProcessedLog.name, schema: ProcessedLogSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'nestjs-kafka',
            brokers: ['localhost:9093'],
          },
          consumer: {
            groupId: 'nestjs-consumer',
          },
        },
      },
    ]),
  ],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: () => {
        return new Kafka({
          clientId: 'nestjs-kafka',
          brokers: ['localhost:9093'],
          retry: {
            retries: 5,
          },
        });
      },
    },
    KafkaService,
  ],
  controllers: [KafkaController],
  exports: ['KAFKA_CLIENT'],
})
export class KafkaModule {}
