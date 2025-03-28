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
import { Order } from '@/modules/orders/entities/order.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AppDataSource } from '@/shared/infra/database/typeorm.config';

describe('ProductsController (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let orderRepository: Repository<Order>;
  let accessTokenAdmin: string;
  let accessTokenEditor: string;
  let accessTokenUser: string;
  let product1: Product;
  let product2: Product;

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

    orderRepository = moduleFixture.get<Repository<Order>>(
      getRepositoryToken(Order),
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
    await productRepository.query('DELETE FROM "order"');
    await productRepository.query('DELETE FROM "product"');
    await userRepository.query(
      `DELETE FROM "user" WHERE email NOT IN ('admin@email.com', 'editor@email.com', 'user@email.com')`,
    );
    product1 = await productRepository.save({
      productName: 'product 1',
      description: 'description product 1',
      price: 1499.99,
      quantityInStock: 45,
      imageUrl: 'https://example.com/laptop-pro15.jpg',
      rating: 4.8,
    });

    product2 = await productRepository.save({
      productName: 'product 2',
      description: 'description product 2',
      price: 1499.99,
      quantityInStock: 45,
      imageUrl: 'https://example.com/laptop-pro15.jpg',
      rating: 4.8,
    });
  });

  describe('Create orders', () => {
    it('/orders (POST) -> Create order with User role', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      expect(response.body).toHaveProperty('totalPrice');
      expect(response.body).toHaveProperty('id');
      expect(response.body.totalPrice).toBe(product1.price + product2.price);
      expect(response.body.status).toBe('pending');
      expect(response.body.user).toHaveProperty('id');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBe(2);
    });

    it('/orders (POST) -> Create order with Admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (POST) -> Create order with Editor role', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenEditor}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (POST) -> Create order with invalid product id', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`a6a00e33-7ab1-44ee-a3a9-fdafab221a`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(422);

      expect(response.statusCode).toBe(422);
      expect(response.body.message).toStrictEqual([
        'each value in productIds must be a UUID',
      ]);
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });

    it('/orders (POST) -> Create order with invalid product', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [
            'a6a00e33-7ab1-44ee-a3a9-fdafab22134a',
            `${product1.id}`,
          ],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(404);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Product not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('List orders', () => {
    it('/orders (GET) -> List orders with User role', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('totalPrice');
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].products.length).toBe(2);
      expect(response.body[0].user).not.toHaveProperty('password');
    });

    it('/orders (GET) -> List orders with Admin role', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (GET) -> List orders with Editor role', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });
  });

  // describe('Search orders', () => { });
  //
  // describe('Patch orders', () => { });
  //
  // describe('Delete orders', () => { });
});
