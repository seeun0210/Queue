import { Controller, Get, Query } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Get('produce')
  async produceMessage(@Query('message') message: string) {
    const msg = message || 'Hello Kafka';
    await this.kafkaService.produceMessage(msg);
    return { message: `Message sent to Kafka` };
  }
}
