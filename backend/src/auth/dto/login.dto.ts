import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'farmer1@grameen.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Farmer@123' })
  @IsString()
  @MinLength(6)
  password: string;
}
