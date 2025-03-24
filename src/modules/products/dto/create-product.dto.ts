import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Name of the product', example: 'Smartphone' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  productName: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'A high-end smartphone with 128GB storage.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Price of the product', example: 799.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Quantity of the product available in stock',
    example: 100,
  })
  @IsInt()
  @IsPositive()
  quantityInStock: number;

  @ApiProperty({
    description: 'Image URL of the product',
    example: 'https://example.com/product-image.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Rating of the product', example: 4.5 })
  @IsNumber()
  @IsOptional()
  rating?: number;
}
