import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({ example: 'Tomato' })
  @IsString()
  commodity: string;

  @ApiPropertyOptional({ example: 'Hybrid' })
  @IsOptional()
  @IsString()
  variety?: string;

  @ApiProperty({ example: 'Guntur Mandi' })
  @IsString()
  market: string;

  @ApiProperty({ example: 'Guntur' })
  @IsString()
  district: string;

  @ApiPropertyOptional({ example: 'AP/TS' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '2024-11-15T00:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Quintal' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  minPrice: number;

  @ApiProperty({ example: 1800 })
  @IsNumber()
  @Min(0)
  maxPrice: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  modalPrice: number;
}
