import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrderDto } from './dto/list-order.dto';
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
  ) {}
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

  async findAll(userId: string, listOrderDto: ListOrderDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderByField = listOrderDto.sort ?? 'createdAt';
    const orderByDir = listOrderDto.sortDir ?? 'ASC';
    const page = Number(
      listOrderDto.page && listOrderDto.page > 0 ? listOrderDto.page : 1,
    );
    const perPage = Number(
      listOrderDto.perPage && listOrderDto.perPage > 0
        ? listOrderDto.perPage
        : 10,
    );

    const count = await this.ordersRepository.count();

    const orders = await this.ordersRepository.find({
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
      order: { [orderByField]: orderByDir },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items: orders,
      total: count,
      currentPage: page,
      perPage,
      sort: orderByField,
      sortDir: orderByDir,
    };

    // return this.ordersRepository.find({
    //   relations: ['user', 'products'],
    //   where: {
    //     user: {
    //       id: user.id,
    //     },
    //   },
    //   select: {
    //     user: {
    //       email: true,
    //       name: true,
    //     },
    //   },
    // });
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

  async update(id: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.ordersRepository.update({ id: id, user: user }, updateOrderDto);

    const order = await this.ordersRepository.findOne({
      where: {
        id,
        user: user,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async remove(id: string, userId: string) {
    const order = await this.findOne(id, userId);
    await this.ordersRepository.remove(order);

    return { message: `Order #${id} successfully removed` };
  }
}
