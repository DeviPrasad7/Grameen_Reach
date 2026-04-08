import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  /**
   * Creates a parent Order and per-farmer SubOrders from the buyer's cart.
   * Each SubOrder groups items from a single farmer.
   */
  async createFromCart(buyerId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: buyerId },
      include: {
        items: {
          include: {
            product: {
              include: { farmer: { select: { id: true, farmerProfile: true } } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Group cart items by farmerId
    const farmerGroups = new Map<
      string,
      { farmerProfileId: string; items: typeof cart.items }
    >();

    for (const item of cart.items) {
      const { product } = item;
      if (!product.farmer?.farmerProfile) {
        throw new BadRequestException(
          `Farmer profile not found for product ${product.title}`,
        );
      }
      const farmerId = product.farmerId;
      const farmerProfileId = product.farmer.farmerProfile.id;

      if (!farmerGroups.has(farmerId)) {
        farmerGroups.set(farmerId, { farmerProfileId, items: [] });
      }
      farmerGroups.get(farmerId)!.items.push(item);
    }

    // Calculate total order amount
    let totalAmount = 0;
    for (const { items } of farmerGroups.values()) {
      for (const item of items) {
        const unitPrice = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
        totalAmount += unitPrice * item.qty;
      }
    }

    // Get delivery fee per sub-order (look up serviceable area)
    const getDeliveryFee = async (pincode?: string): Promise<number> => {
      if (!pincode) return 50;
      const area = await this.prisma.serviceableArea.findUnique({ where: { pincode } });
      return area?.flatFee ?? 50;
    };

    // Create parent Order + SubOrders in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const parentOrder = await tx.order.create({
        data: {
          buyerId,
          totalAmount,
          paymentMethod: dto.paymentMethod as any ?? 'COD',
          deliveryAddress: dto.deliveryAddress,
          notes: dto.notes,
          status: 'PLACED',
        },
      });

      for (const [, { farmerProfileId, items }] of farmerGroups) {
        let subAmount = 0;
        for (const item of items) {
          const unitPrice = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
          subAmount += unitPrice * item.qty;
        }

        const deliveryFee = await getDeliveryFee(items[0]?.product.pincode ?? undefined);

        const subOrder = await tx.subOrder.create({
          data: {
            orderId: parentOrder.id,
            farmerProfileId,
            amount: subAmount,
            deliveryFee,
            status: 'PLACED',
          },
        });

        for (const item of items) {
          const unitPrice = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
          await tx.subOrderItem.create({
            data: {
              subOrderId: subOrder.id,
              productId: item.productId,
              qty: item.qty,
              unitPrice,
            },
          });

          // Decrement available quantity
          await tx.product.update({
            where: { id: item.productId },
            data: { availableQty: { decrement: item.qty } },
          });
        }
      }

      return parentOrder;
    });

    // Clear the cart after successful order
    await this.cartService.clearCart(buyerId);

    return this.findOne(order.id, buyerId, 'BUYER');
  }

  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.order.findMany({
        include: { subOrders: { include: { items: { include: { product: true } } } }, buyer: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === 'FARMER') {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      if (!profile) return [];
      return this.prisma.subOrder.findMany({
        where: { farmerProfileId: profile.id },
        include: {
          order: { include: { buyer: { select: { name: true, email: true } } } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // BUYER
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        subOrders: {
          include: {
            items: { include: { product: true } },
            farmerProfile: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        subOrders: {
          include: {
            items: { include: { product: { include: { category: true } } } },
            farmerProfile: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (role === 'BUYER' && order.buyerId !== userId) {
      throw new ForbiddenException('Not your order');
    }

    if (role === 'FARMER') {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      const hasSubOrder = order.subOrders.some((so) => so.farmerProfileId === profile?.id);
      if (!hasSubOrder) throw new ForbiddenException('No access to this order');
    }

    return order;
  }

  async updateSubOrderStatus(
    orderId: string,
    subOrderId: string,
    farmerId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { farmerProfile: true },
    });

    if (!subOrder || subOrder.orderId !== orderId) {
      throw new NotFoundException('SubOrder not found');
    }
    if (subOrder.farmerProfile.userId !== farmerId) {
      throw new ForbiddenException('Not your sub-order');
    }

    return this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: dto.status as any },
    });
  }
}
