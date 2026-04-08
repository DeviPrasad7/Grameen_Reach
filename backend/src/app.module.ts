import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmerModule } from './farmer/farmer.module';
import { ProductsModule } from './products/products.module';
import { BidsModule } from './bids/bids.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { GovtPricesModule } from './govt-prices/govt-prices.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmerModule,
    ProductsModule,
    BidsModule,
    CartModule,
    OrdersModule,
    GovtPricesModule,
    PaymentsModule,
    AiModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
