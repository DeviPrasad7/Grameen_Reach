import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({ example: 'product-cuid-here' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 22.5 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'I can take 100kg at this price' })
  @IsOptional()
  @IsString()
  message?: string;
}
