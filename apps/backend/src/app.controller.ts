import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Liveness only: no DB roundtrip, so it stays cheap on the constrained VPS. */
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
