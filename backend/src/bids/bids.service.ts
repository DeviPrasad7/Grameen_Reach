import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { RespondBidDto, BidResponseAction } from './dto/respond-bid.dto';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async createBid(buyerId: string, dto: CreateBidDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.priceType === 'FIXED') {
      throw new BadRequestException('This product does not accept bids');
    }
    if (product.minBidPrice && dto.amount < product.minBidPrice) {
      throw new BadRequestException(`Bid must be at least ${product.minBidPrice}`);
    }

    const bid = await this.prisma.bid.create({
      data: { productId: dto.productId, buyerId, amount: dto.amount, message: dto.message },
      include: { product: { select: { title: true, farmerId: true } }, buyer: { select: { name: true } } },
    });

    // Auto-accept if bid meets autoBidAccept threshold
    if (product.autoBidAccept && dto.amount >= product.autoBidAccept) {
      await this.prisma.bid.update({ where: { id: bid.id }, data: { status: 'ACCEPTED' } });
      return { ...bid, status: 'ACCEPTED', autoAccepted: true };
    }

    return bid;
  }

  async getBidsByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.bid.findMany({
      where: { productId },
      include: { buyer: { select: { id: true, name: true } } },
      orderBy: { amount: 'desc' },
    });
  }

  async getMyBids(buyerId: string) {
    return this.prisma.bid.findMany({
      where: { buyerId },
      include: { product: { select: { id: true, title: true, imageUrls: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFarmerBids(farmerId: string) {
    return this.prisma.bid.findMany({
      where: { product: { farmerId } },
      include: {
        product: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToBid(bidId: string, farmerId: string, dto: RespondBidDto) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { product: true },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only respond to bids on your products');
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException('Bid is no longer pending');
    }
    if (dto.action === BidResponseAction.COUNTER && !dto.counterAmount) {
      throw new BadRequestException('Counter amount is required');
    }

    const statusMap = {
      [BidResponseAction.ACCEPT]: 'ACCEPTED',
      [BidResponseAction.REJECT]: 'REJECTED',
      [BidResponseAction.COUNTER]: 'COUNTERED',
    };

    return this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: statusMap[dto.action] as any,
        counterAmount: dto.counterAmount,
        counterMessage: dto.counterMessage,
      },
    });
  }
}
