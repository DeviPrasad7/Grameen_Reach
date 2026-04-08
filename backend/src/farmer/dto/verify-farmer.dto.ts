import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum VerifyAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class VerifyFarmerDto {
  @ApiProperty({ enum: VerifyAction })
  @IsEnum(VerifyAction)
  action: VerifyAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
