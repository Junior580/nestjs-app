import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/current-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Roles(Role.USER)
  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: FastifyRequest,
  ) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Roles(Role.USER)
  @Get()
  findAll(@Request() req: FastifyRequest) {
    return this.ordersService.findAll(req.user.id);
  }

  @Roles(Role.USER)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: FastifyRequest) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
