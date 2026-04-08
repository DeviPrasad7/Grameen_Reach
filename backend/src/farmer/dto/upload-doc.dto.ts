import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DocType {
  RATION_CARD = 'RATION_CARD',
  FARMER_ID = 'FARMER_ID',
  LAND_DOCUMENT = 'LAND_DOCUMENT',
  AADHAAR = 'AADHAAR',
  OTHER = 'OTHER',
}

export class UploadDocDto {
  @ApiProperty({ enum: DocType })
  @IsEnum(DocType)
  docType: DocType;

  @ApiProperty({ example: 'https://example.com/doc.pdf' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  docNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
