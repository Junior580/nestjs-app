import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const products: Product[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const product = await this.productsRepository
        .findOneOrFail({
          where: { id: productIds[i] },
        })
        .catch(() => {
          throw new NotFoundException('Product not found');
        });
      products.push(product);
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

  async findAll(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.ordersRepository.find({
      relations: ['user', 'products'],
      where: {
        user: {
          id: user.id,
        },
      },
      select: {
        user: {
          email: true,
          name: true,
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id, user: { id: userId } },
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
