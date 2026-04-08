import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'product-cuid-here' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0.01)
  qty: number;
}
