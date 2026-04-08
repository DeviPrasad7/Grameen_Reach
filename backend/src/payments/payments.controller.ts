import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate payment (COD/dummy/Stripe/Razorpay)' })
  initiate(@CurrentUser() user: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.id, dto);
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment status for an order' })
  getStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getStatus(orderId);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook (stub)' })
  stripeWebhook(@Body() payload: any) {
    return this.paymentsService.stripeWebhook(payload);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay webhook (stub)' })
  razorpayWebhook(@Body() payload: any) {
    return this.paymentsService.razorpayWebhook(payload);
  }
}
