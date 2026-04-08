import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { QueryPriceDto } from './dto/query-price.dto';

@Injectable()
export class GovtPricesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePriceDto, uploadedBy?: string) {
    return this.prisma.govtPrice.create({
      data: {
        commodity: dto.commodity,
        variety: dto.variety,
        market: dto.market,
        district: dto.district,
        state: dto.state ?? 'AP/TS',
        date: new Date(dto.date),
        unit: dto.unit ?? 'Quintal',
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
        modalPrice: dto.modalPrice,
        uploadedBy,
      },
    });
  }

  async uploadCsv(buffer: Buffer, uploadedBy: string) {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{
      commodity: string;
      variety?: string;
      market: string;
      district: string;
      date: string;
      unit?: string;
      minPrice: string;
      maxPrice: string;
      modalPrice: string;
    }>;

    const created = await Promise.all(
      records.map((row) =>
        this.prisma.govtPrice.create({
          data: {
            commodity: row.commodity,
            variety: row.variety || null,
            market: row.market,
            district: row.district,
            date: new Date(row.date),
            unit: row.unit ?? 'Quintal',
            minPrice: parseFloat(row.minPrice),
            maxPrice: parseFloat(row.maxPrice),
            modalPrice: parseFloat(row.modalPrice),
            uploadedBy,
          },
        }),
      ),
    );

    return { imported: created.length };
  }

  async findAll(query: QueryPriceDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.commodity) {
      where.commodity = { contains: query.commodity, mode: 'insensitive' };
    }
    if (query.district) {
      where.district = { contains: query.district, mode: 'insensitive' };
    }
    if (query.date) {
      const d = new Date(query.date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }

    const [items, total] = await Promise.all([
      this.prisma.govtPrice.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.govtPrice.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getPriceSuggestions(commodity: string, district: string) {
    const recent = await this.prisma.govtPrice.findMany({
      where: {
        commodity: { contains: commodity, mode: 'insensitive' },
        district: { contains: district, mode: 'insensitive' },
      },
      orderBy: { date: 'desc' },
      take: 7,
    });

    if (recent.length === 0) {
      return { message: 'No mandi data available for this commodity and district', suggestions: [] };
    }

    const avgModal = recent.reduce((s, r) => s + r.modalPrice, 0) / recent.length;
    const latestModal = recent[0].modalPrice;

    return {
      commodity,
      district,
      latestModal,
      avgModal7Days: Math.round(avgModal * 100) / 100,
      suggestedMin: Math.round(latestModal * 0.9 * 100) / 100,
      suggestedMax: Math.round(latestModal * 1.1 * 100) / 100,
      history: recent,
    };
  }

  async getPriceComparison(commodity: string, district: string) {
    const mandiData = await this.getPriceSuggestions(commodity, district);

    const marketListings = await this.prisma.product.findMany({
      where: {
        title: { contains: commodity, mode: 'insensitive' },
        district: { contains: district, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        fixedPrice: true,
        unit: true,
        farmer: { select: { name: true } },
      },
      take: 10,
    });

    return {
      mandiPrices: mandiData,
      marketListings,
      unit: 'KG',
      note: 'Mandi prices are per Quintal (100 KG)',
    };
  }
}
