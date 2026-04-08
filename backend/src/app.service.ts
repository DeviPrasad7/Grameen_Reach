import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { status: 'ok', service: 'grameen-reach-api', timestamp: new Date().toISOString() };
  }
}
