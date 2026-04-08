import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateFarmerProfileDto {
  @ApiProperty({ example: 'Guntur' })
  @IsString()
  district: string;

  @ApiProperty({ example: '522001' })
  @IsString()
  pincode: string;

  @ApiPropertyOptional({ example: 'Nadikudi' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ example: 'Ponnur' })
  @IsOptional()
  @IsString()
  mandal?: string;

  @ApiPropertyOptional({ example: 'Organic farmer for 10 years' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234' })
  @IsOptional()
  @IsString()
  bankIfsc?: string;
}
