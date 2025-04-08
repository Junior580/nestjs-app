import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ description: 'User e-mail' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ description: 'User password' })
  @IsString()
  @IsOptional()
  password: string;

  @ApiPropertyOptional({ description: 'User avatar url' })
  @IsOptional()
  @IsUrl()
  avatarUrl: string;
}
