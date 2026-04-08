import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AiRequestDto {
  @ApiProperty({ example: 'Tomato 500kg Grade A organic from Guntur' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ example: 'gemini' })
  @IsOptional()
  @IsString()
  preferredModel?: string;
}
