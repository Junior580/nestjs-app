import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { Order } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UsersModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
