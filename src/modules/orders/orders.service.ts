import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { productIds } = createOrderDto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const products = await this.productsRepository.findBy({
      id: In(productIds),
    });

    if (products.length === 0) {
      throw new NotFoundException('No valid products found for the order');
    }

    const totalPrice = products
      .reduce((sum, product) => sum + Number(product.price), 0)
      .toFixed(2);

    const order = this.ordersRepository.create({
      user,
      products,
      totalPrice: Number(totalPrice),
      status: 'pending',
    });

    return this.ordersRepository.save(order);
  }

  findAll() {
    return this.ordersRepository.find({
      relations: ['user', 'products'],
      select: {
        user: {
          email: true,
          name: true,
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'products'],
      select: {
        user: {
          email: true,
          name: true,
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    // const order = await this.findOne(id);
    //
    // if (updateOrderDto.productIds) {
    //   const products = await this.productsRepository.findByIds(
    //     updateOrderDto.productIds,
    //   );
    //   if (products.length === 0) {
    //     throw new NotFoundException('No valid products found for the order');
    //   }
    //   order.products = products;
    // }
    //
    // if (updateOrderDto.status) {
    //   order.status = updateOrderDto.status;
    // }
    //
    // return this.ordersRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }
}
