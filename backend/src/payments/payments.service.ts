import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async initiate(buyerId: string, dto: InitiatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new BadRequestException('Not your order');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    if (dto.method === 'COD') {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { paymentMethod: 'COD', paymentStatus: 'PENDING' },
      });
      return { method: 'COD', message: 'Cash on delivery selected. Pay when order arrives.' };
    }

    if (dto.method === 'DUMMY_CARD') {
      const ref = `DUMMY-${Date.now()}`;
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { paymentMethod: 'DUMMY_CARD', paymentStatus: 'PAID', paymentRef: ref },
      });
      return { method: 'DUMMY_CARD', status: 'PAID', ref, message: 'Dummy payment successful' };
    }

    if (dto.method === 'STRIPE') {
      return { method: 'STRIPE', message: 'Stripe integration stub. Set STRIPE_SECRET_KEY to enable.', checkoutUrl: null };
    }

    if (dto.method === 'RAZORPAY') {
      return { method: 'RAZORPAY', message: 'Razorpay integration stub. Set RAZORPAY_KEY_ID to enable.', checkoutUrl: null };
    }

    throw new BadRequestException('Unsupported payment method');
  }

  async getStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentMethod: true, paymentStatus: true, paymentRef: true, totalAmount: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async stripeWebhook(payload: any) {
    // Stripe webhook stub - implement with actual Stripe SDK
    return { received: true };
  }

  async razorpayWebhook(payload: any) {
    // Razorpay webhook stub - implement with actual Razorpay SDK
    return { received: true };
  }
}
