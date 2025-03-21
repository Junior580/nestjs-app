import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { AuthGuard } from '../auth/auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductDto } from './dto/list-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        productName: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        price: {
          type: 'number',
        },
        quantityInStock: {
          type: 'number',
        },
        imageUrl: {
          type: 'number',
        },
        rating: {
          type: 'number',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product already exists',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Product list',
    schema: {
      type: 'array',
      properties: {
        id: {
          type: 'string',
        },
        productName: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        price: {
          type: 'number',
        },
        quantityInStock: {
          type: 'number',
        },
        imageUrl: {
          type: 'number',
        },
        rating: {
          type: 'number',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() listproductDto: ListProductDto) {
    return this.productsService.findAll(listproductDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get product',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        productName: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        price: {
          type: 'number',
        },
        quantityInStock: {
          type: 'number',
        },
        imageUrl: {
          type: 'number',
        },
        rating: {
          type: 'number',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Product updated deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Product successfully removed',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
