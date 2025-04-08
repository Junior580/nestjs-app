import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

import { AuthProvider } from '@/modules/auth/types/auth-provider';

export class CreateUserDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User e-mail' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @ValidateIf((dto: CreateUserDto) => dto.provider === AuthProvider.LOCAL)
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'Authentication provider',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  @IsEnum(AuthProvider)
  @IsOptional()
  provider?: AuthProvider = AuthProvider.LOCAL;

  @ApiProperty({
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
