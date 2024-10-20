import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, Producer } from 'kafkajs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLog } from '../user-log.schema';
import { ProcessedLog } from '../processed-log.schema';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;
  private readonly consumer: Consumer;

  constructor(
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
    @InjectModel(ProcessedLog.name)
    private processedLogModel: Model<ProcessedLog>,
  ) {
    const kafka = new Kafka({
      clientId: 'nestjs-kafka-client',
      brokers: ['localhost:9093'],
    });

    this.producer = kafka.producer();
    this.consumer = kafka.consumer({
      groupId: 'nestjs-consumer-group',
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'user-log-processing',
      fromBeginning: true,
    });

    // 병렬 처리를 위해 Promise.all을 사용
    await this.consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        const batchSize = 3;
        const messageBatches = [];

        // 배치로 나누기
        for (let i = 0; i < batch.messages.length; i += batchSize) {
          messageBatches.push(batch.messages.slice(i, i + batchSize));
        }

        // 각 배치를 병렬 처리
        await Promise.all(
          messageBatches.map(async (messages) => {
            const values = messages.map((message) => message.value.toString());
            await this.processMessageBatch(values, batch.partition);

            // 각 메시지의 오프셋을 커밋
            messages.forEach((message) => resolveOffset(message.offset));
            await heartbeat();
          }),
        );
      },
    });
  }

  private async processMessageBatch(messages: string[], partition: number) {
    console.log(`Processing batch from partition ${partition}: ${messages}`);

    const processedLogs = messages.map((message) => ({
      userId: message,
      originalAction: message,
      processedAction: message.toUpperCase(),
      timestamp: new Date(),
    }));

    await this.processedLogModel.insertMany(processedLogs);
    console.log(`Processed and saved batch of ${processedLogs.length} logs.`);
  }

  async produceMessage(message: string) {
    await this.producer.send({
      topic: 'user-log-processing',
      messages: [{ value: message }],
    });
  }
}
