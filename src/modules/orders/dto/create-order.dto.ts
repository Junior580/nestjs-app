import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  @ArrayMinSize(1, { message: 'At least one product ID is required' })
  productIds: string[];
}
