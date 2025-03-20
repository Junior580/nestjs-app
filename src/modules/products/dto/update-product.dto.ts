import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Smartphone',
    required: false,
  })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'A high-end smartphone with 128GB storage.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 799.99,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Quantity of the product available in stock',
    example: 100,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantityInStock?: number;

  @ApiProperty({
    description: 'Image URL of the product',
    example: 'https://example.com/product-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Rating of the product',
    example: 4.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  rating?: number;
}
