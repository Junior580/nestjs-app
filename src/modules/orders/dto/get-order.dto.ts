import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetOrderDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
