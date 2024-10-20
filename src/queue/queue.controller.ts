import { Controller, Get } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('add')
  async produceMessage() {
    await this.queueService.addToQueue();
    return { message: 'Message added to Bull Queue' };
  }
}
