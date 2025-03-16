import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'User e-mail' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsOptional()
  password: string;
}
