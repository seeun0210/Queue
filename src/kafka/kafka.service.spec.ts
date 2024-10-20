// kafka.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserLog } from '../user-log.schema';
import { ProcessedLog } from '../processed-log.schema';
import { Kafka } from 'kafkajs';

describe('KafkaService', () => {
  let kafkaService: KafkaService;
  let kafkaMockClient: Kafka;
  let consumerMock: any;
  let userLogModelMock: any;
  let processedLogModelMock: any;

  beforeEach(async () => {
    kafkaMockClient = {
      producer: jest.fn().mockReturnValue({
        connect: jest.fn(),
        send: jest.fn(),
        disconnect: jest.fn(),
      }),
      consumer: jest.fn().mockReturnValue({
        connect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn().mockImplementation(({ eachMessage }) => {
          // 각 메시지를 처리하는 mock implementation
          return eachMessage({
            topic: 'user-log-processing',
            partition: 0,
            message: {
              value: Buffer.from('123'), // userId 값을 포함한 메시지
            },
          });
        }),
        disconnect: jest.fn(),
      }),
    } as any;

    // Mock for Mongoose models
    userLogModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([
            { userId: '123', action: 'test', timestamp: new Date() },
          ]),
      }),
    };

    processedLogModelMock = {
      create: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: 'KAFKA_CLIENT',
          useValue: kafkaMockClient,
        },
        {
          provide: getModelToken(UserLog.name),
          useValue: userLogModelMock,
        },
        {
          provide: getModelToken(ProcessedLog.name),
          useValue: processedLogModelMock,
        },
      ],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
    consumerMock = kafkaMockClient.consumer({ groupId: 'nestjs-consumer' });
  });

  it('should consume and process a message', async () => {
    await kafkaService.onModuleInit();

    expect(consumerMock.subscribe).toHaveBeenCalledWith({
      topic: 'user-log-processing',
      fromBeginning: true,
    });
    expect(consumerMock.run).toHaveBeenCalled();
    expect(userLogModelMock.find).toHaveBeenCalledWith({ userId: '123' });
    expect(processedLogModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '123',
        originalAction: 'test',
        processedAction: 'TEST',
        timestamp: expect.any(Date),
      }),
    );
  });
});
