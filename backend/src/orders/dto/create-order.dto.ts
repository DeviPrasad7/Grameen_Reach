import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreateOrderDto {
  @ApiProperty({
    example: { name: 'Raju Kumar', street: '12 Main St', city: 'Guntur', pincode: '522001', state: 'AP' },
  })
  deliveryAddress: Record<string, any>;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'Leave at door' })
  @IsOptional()
  @IsString()
  notes?: string;
}
