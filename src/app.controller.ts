import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as client from 'prom-client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('metrics')
  async getMetrics() {
    return client.register.metrics(); // 모든 메트릭을 Prometheus에 노출
  }
}
