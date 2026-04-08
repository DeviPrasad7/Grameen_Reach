import { Module } from '@nestjs/common';
import { GovtPricesService } from './govt-prices.service';
import { GovtPricesController } from './govt-prices.controller';

@Module({
  providers: [GovtPricesService],
  controllers: [GovtPricesController],
  exports: [GovtPricesService],
})
export class GovtPricesModule {}
