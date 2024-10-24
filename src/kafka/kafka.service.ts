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
    const startTime = Date.now();
    let messageCount = 0;

    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'user-log-processing',
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let userLog = await this.userLogModel
          .findOne({ isProcessed: { $ne: true } })
          .exec();

        while (userLog && messageCount < 100) {
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

          userLog = await this.userLogModel
            .findOne({ isProcessed: false })
            .exec();

          messageCount++;
        }

        if (messageCount === 100) {
          const endTime = Date.now();
          const totalTime = (endTime - startTime) / 1000;
          console.log(
            `Total time taken to process 100 messages: ${totalTime} seconds`,
          );
        }
      },
    });
  }

  async produceMessage(message: string) {
    await this.producer.send({
      topic: 'user-log-processing',
      messages: [{ value: message }],
    });
  }
}
