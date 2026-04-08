import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PriceType } from '../../common/enums/price-type.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'category-cuid-here' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Fresh Tomatoes' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'తాజా టమాటాలు' })
  @IsOptional()
  @IsString()
  titleTE?: string;

  @ApiPropertyOptional({ example: 'Farm fresh tomatoes from Guntur district' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionTE?: string;

  @ApiProperty({ example: 'KG' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ enum: PriceType, default: PriceType.FIXED })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({ example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @ApiPropertyOptional({ example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBidPrice?: number;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoBidAccept?: number;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  bidEndsAt?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  organic?: boolean;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional({ example: '2024-11-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQty?: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  availableQty: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'Nadikudi' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ example: 'Guntur' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: '522001' })
  @IsOptional()
  @IsString()
  pincode?: string;
}
