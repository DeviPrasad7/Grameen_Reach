import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum BidResponseAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  COUNTER = 'COUNTER',
}

export class RespondBidDto {
  @ApiProperty({ enum: BidResponseAction })
  @IsEnum(BidResponseAction)
  action: BidResponseAction;

  @ApiPropertyOptional({ example: 26.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  counterAmount?: number;

  @ApiPropertyOptional({ example: 'My best price for premium quality' })
  @IsOptional()
  @IsString()
  counterMessage?: string;
}
