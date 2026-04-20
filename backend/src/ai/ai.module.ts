import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GovtPricesModule } from '../govt-prices/govt-prices.module';

@Module({
  imports: [GovtPricesModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
