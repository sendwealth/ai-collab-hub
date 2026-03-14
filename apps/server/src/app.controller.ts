import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Welcome to AI Collaboration Platform API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
    };
  }
}
