import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '@/app.module';
import { Order } from '@/modules/orders/entities/order.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AppDataSource } from '@/shared/infra/database/typeorm.config';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orderRepository: Repository<Order>;
  let accessToken: string;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        transform: true,
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    orderRepository = moduleFixture.get<Repository<Order>>(
      getRepositoryToken(Order),
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await orderRepository.query('DELETE FROM "order_products"');
    await orderRepository.query('DELETE FROM "order"');
    await userRepository.query('DELETE FROM "user"');
  });
});
