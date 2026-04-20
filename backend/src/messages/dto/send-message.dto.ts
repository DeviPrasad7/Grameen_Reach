import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'prod-tomatoes' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Can you share the harvest date and bulk rate?' })
  @IsString()
  @MinLength(3)
  message: string;
}