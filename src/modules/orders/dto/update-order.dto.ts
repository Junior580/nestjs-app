import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Status of product', example: 'pending' })
  @IsEnum(['pending', 'completed', 'cancelled'], {
    message:
      'Status must be one of the following: pending, completed, or cancelled.',
  })
  status: 'pending' | 'completed' | 'cancelled';
}
