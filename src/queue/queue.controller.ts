import { Controller, Get } from '@nestjs/common';
import { QueueService } from './queue.service';
import * as client from 'prom-client';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('add')
  async produceMessage() {
    console.log('>>>>');
    await this.queueService.addToQueue();
    return { message: 'Message added to Bull Queue' };
  }

  @Get('metrics')
  async getMetrics() {
    return client.register.metrics();
  }
}
