/* eslint @typescript-eslint/no-unsafe-assignment: "off" */
/* eslint @typescript-eslint/no-unsafe-member-access: "off" */
/* eslint @typescript-eslint/no-unsafe-argument: "off" */

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '@/app.module';
import { Role } from '@/modules/auth/types/current-user';
import { Product } from '@/modules/products/entities/product.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AppDataSource } from '@/shared/infra/database/typeorm.config';

describe('ProductsController (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let accessTokenAdmin: string;
  let accessTokenEditor: string;
  let accessTokenUser: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

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
    await app.getHttpAdapter().getInstance().ready();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    await userRepository.save([
      {
        name: 'user admin',
        email: 'admin@email.com',
        password: await hash('password123', 6),
        role: Role.ADMIN,
      },
      {
        name: 'user editor',
        email: 'editor@email.com',
        password: await hash('password123', 6),
        role: Role.EDITOR,
      },
      {
        name: 'user',
        email: 'user@email.com',
        password: await hash('password123', 6),
      },
    ]);

    const authAdmin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'editor@email.com',
        password: 'password123',
      })
      .expect(201);

    accessTokenAdmin = authAdmin.body.accessToken;

    const authEditor = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'editor@email.com',
        password: 'password123',
      })
      .expect(201);

    accessTokenEditor = authEditor.body.accessToken;

    const authUser = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'user@email.com',
        password: 'password123',
      })
      .expect(201);

    accessTokenUser = authUser.body.accessToken;
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM "user"');
    await AppDataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await productRepository.query('DELETE FROM "order_products"');
    await productRepository.query('DELETE FROM "product"');
    await userRepository.query(
      `DELETE FROM "user" WHERE email NOT IN ('admin@email.com', 'editor@email.com', 'user@email.com')`,
    );
  });

  describe('Create orders', () => { });

  describe('List orders', () => { });

  describe('Search orders', () => { });

  describe('Patch orders', () => { });

  describe('Delete orders', () => { });
});
