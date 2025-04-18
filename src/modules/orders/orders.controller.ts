import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/current-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrderDto } from './dto/get-order.dto';
import { ListOrderDto } from './dto/list-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        totalPrice: { type: 'number' },
        status: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              productName: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              quantityInStock: { type: 'number' },
              imageUrl: { type: 'string' },
              rating: { type: 'number' },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        orderDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @Roles(Role.USER)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Order list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          totalPrice: { type: 'string' },
          status: { type: 'string' },
          orderDate: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                productName: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'string' },
                quantityInStock: { type: 'number' },
                imageUrl: { type: 'string', format: 'uri' },
                rating: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(Role.USER)
  @Get()
  findAll(@Req() req: Request, @Query() listOrderDto: ListOrderDto) {
    return this.ordersService.findAll(req.user.id, listOrderDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Order get',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        totalPrice: { type: 'string' },
        status: { type: 'string' },
        orderDate: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              productName: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'string' },
              quantityInStock: { type: 'number' },
              imageUrl: { type: 'string', format: 'uri' },
              rating: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(Role.USER)
  @Get(':id')
  findOne(@Param() param: GetOrderDto, @Req() req: Request) {
    return this.ordersService.findOne(param.id, req.user.id);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Order update',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
        totalPrice: {
          type: 'string',
        },
        status: {
          type: 'string',
        },
        orderDate: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(Role.USER)
  @Patch(':id')
  update(
    @Param() param: GetOrderDto,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: Request,
  ) {
    return this.ordersService.update(param.id, req.user.id, updateOrderDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Order deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User successfully removed',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(Role.USER)
  @Delete(':id')
  remove(@Param() param: GetOrderDto, @Req() req: Request) {
    return this.ordersService.remove(param.id, req.user.id);
  }
}
