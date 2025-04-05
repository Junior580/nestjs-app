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
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/current-user';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductDto } from './dto/get-product.dto';
import { ListProductDto } from './dto/list-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

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
  @Public()
  @Get()
  findAll(@Query() listproductDto: ListProductDto) {
    return this.productsService.findAll(listproductDto);
  }

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
  @Public()
  @Get(':id')
  findOne(@Param() param: GetProductDto) {
    return this.productsService.findOne(param.id);
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
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(
    @Param() param: GetProductDto,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(param.id, updateProductDto);
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
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @Delete(':id')
  remove(@Param() param: GetProductDto) {
    return this.productsService.remove(param.id);
  }
}
