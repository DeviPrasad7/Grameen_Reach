import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(farmerId: string, dto: CreateProductDto) {
    // Ensure farmer is Level 1 verified
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId: farmerId } });
    if (!profile || profile.verificationLevel !== 'LEVEL_1') {
      throw new ForbiddenException('Only Level 1 verified farmers can create listings');
    }

    return this.prisma.product.create({
      data: {
        farmerId,
        categoryId: dto.categoryId,
        title: dto.title,
        titleTE: dto.titleTE,
        description: dto.description,
        descriptionTE: dto.descriptionTE,
        unit: dto.unit,
        priceType: dto.priceType as any ?? 'FIXED',
        fixedPrice: dto.fixedPrice,
        minBidPrice: dto.minBidPrice,
        autoBidAccept: dto.autoBidAccept,
        bidEndsAt: dto.bidEndsAt ? new Date(dto.bidEndsAt) : undefined,
        grade: dto.grade,
        organic: dto.organic ?? false,
        moisture: dto.moisture,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        minQty: dto.minQty ?? 1,
        availableQty: dto.availableQty,
        imageUrls: dto.imageUrls ?? [],
        village: dto.village,
        district: dto.district,
        pincode: dto.pincode,
      },
      include: { category: true, farmer: { select: { name: true, id: true } } },
    });
  }

  async findAll(query: QueryProductsDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    if (query.category) {
      where.category = { name: { contains: query.category, mode: 'insensitive' } };
    }
    if (query.district) {
      where.district = { contains: query.district, mode: 'insensitive' };
    }
    if (query.priceType) {
      where.priceType = query.priceType;
    }
    if (query.organic !== undefined) {
      where.organic = query.organic;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          farmer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        farmer: { select: { id: true, name: true, farmerProfile: true } },
        bids: { where: { status: 'PENDING' }, orderBy: { amount: 'desc' }, take: 5 },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, farmerId: string, role: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.farmerId !== farmerId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only edit your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        priceType: dto.priceType as any,
        status: dto.status as any,
        bidEndsAt: dto.bidEndsAt ? new Date(dto.bidEndsAt) : undefined,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
      },
    });
  }

  async remove(id: string, farmerId: string, role: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.farmerId !== farmerId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: 'REMOVED' },
    });
  }
}
