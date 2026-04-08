import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryPriceDto {
  @ApiPropertyOptional({ example: 'Tomato' })
  @IsOptional()
  @IsString()
  commodity?: string;

  @ApiPropertyOptional({ example: 'Guntur' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: '2024-11-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;
}
