import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(buyerId: string, dto: SendMessageDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        farmer: {
          select: {
            id: true,
            farmerProfile: { select: { id: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (!product.farmer?.farmerProfile?.id) {
      throw new BadRequestException('Farmer profile not found for this product');
    }

    const created = await this.prisma.customerMessage.create({
      data: {
        productId: product.id,
        buyerId,
        farmerProfileId: product.farmer.farmerProfile.id,
        message: dto.message.trim(),
      },
      include: {
        product: { select: { id: true, title: true, unit: true } },
        buyer: { select: { id: true, name: true, email: true } },
        farmerProfile: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return created;
  }

  async getInbox(farmerUserId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId: farmerUserId } });
    if (!profile) return [];

    return this.prisma.customerMessage.findMany({
      where: { farmerProfileId: profile.id },
      include: {
        product: { select: { id: true, title: true, unit: true, district: true, imageUrls: true } },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        farmerProfile: { select: { id: true, verificationLevel: true, district: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentMessages(buyerId: string) {
    return this.prisma.customerMessage.findMany({
      where: { buyerId },
      include: {
        product: { select: { id: true, title: true, unit: true, district: true } },
        farmerProfile: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(messageId: string, farmerUserId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId: farmerUserId } });
    if (!profile) throw new NotFoundException('Farmer profile not found');

    const message = await this.prisma.customerMessage.findUnique({ where: { id: messageId } });
    if (!message || message.farmerProfileId !== profile.id) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.customerMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}