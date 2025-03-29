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
  let accessTokenUser2: string;
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
      {
        name: 'user2',
        email: 'user2@email.com',
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

    const authUser2 = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'user2@email.com',
        password: 'password123',
      })
      .expect(201);

    accessTokenUser2 = authUser2.body.accessToken;
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
      `DELETE FROM "user" WHERE email NOT IN ('admin@email.com', 'editor@email.com', 'user@email.com', 'user2@email.com')`,
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

    it('/orders (POST) -> Create order with invalid product list length', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(422);

      expect(response.statusCode).toBe(422);
      expect(response.body.message).toStrictEqual([
        'At least one product ID is required',
      ]);
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
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

      expect(response.body.items[0]).toHaveProperty('totalPrice');
      expect(response.body.items[0]).toHaveProperty('id');
      expect(response.body.items[0].products.length).toBe(2);
      expect(response.body.items[0].user).not.toHaveProperty('password');
    });

    it('/orders (GET) -> List orders from another user', async () => {
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
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('perPage');
      expect(response.body).toHaveProperty('sort');
      expect(response.body).toHaveProperty('sortDir');
      expect(response.body.items).toStrictEqual([]);
      expect(response.statusCode).toBe(200);
    });

    it('/orders (GET) -> List orders Ordered by CreatedAt ASC', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      await new Promise((r) => setTimeout(r, 1000));

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product2.id}`, `${product1.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/orders?page=1&perPage=2&sort=createdAt&sortDir=ASC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const orders = response.body.items;
      expect(orders.length).toBeGreaterThan(1);
      expect(new Date(orders[0].createdAt).getTime()).toBeLessThan(
        new Date(orders[1].createdAt).getTime(),
      );
    });

    it('/orders (GET) -> List orders Ordered by CreatedAt DESC', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      await new Promise((r) => setTimeout(r, 1000));

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product2.id}`, `${product1.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/orders?page=1&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const orders = response.body.items;
      expect(orders.length).toBeGreaterThan(1);
      expect(new Date(orders[1].createdAt).getTime()).toBeLessThan(
        new Date(orders[0].createdAt).getTime(),
      );
    });

    it('/orders (GET) -> List orders pagination', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      await new Promise((r) => setTimeout(r, 1000));

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product2.id}`, `${product1.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      await new Promise((r) => setTimeout(r, 1000));

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product2.id}`, `${product1.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const responsePage1 = await request(app.getHttpServer())
        .get('/orders?page=1&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const ordersPage1 = responsePage1.body.items;
      expect(ordersPage1.length).toBe(2);
      expect(new Date(ordersPage1[0].createdAt).getTime()).toBeGreaterThan(
        new Date(ordersPage1[1].createdAt).getTime(),
      );

      const responsePage2 = await request(app.getHttpServer())
        .get('/orders?page=2&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const ordersPage2 = responsePage2.body.items;
      expect(ordersPage2.length).toBe(1);

      expect(ordersPage1).not.toEqual(ordersPage2);
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

  describe('Search orders', () => {
    it('/orders (GET) -> Get orders with User role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPrice');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderDate');
      expect(response.body).toHaveProperty('user');
      expect(response.body.products.length).toBe(2);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('/orders (GET) -> Get orders from another user', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .expect(404);

      expect(response.body.message).toBe('Order not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });

    it('/orders (GET) -> Get orders with Admin role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (GET) -> Get orders with Editor role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenEditor}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });
  });

  describe('Patch orders', () => {
    it('/orders (PATCH) -> Update orders with User role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}`)
        .send({
          status: 'completed',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });

    it('/orders (PATCH) -> Update order from another User', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}`)
        .send({
          status: 'completed',
        })
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .expect(404);

      expect(response.body.message).toBe('Order not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });

    it('/orders (PATCH) -> Update order with Admin role ', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}`)
        .send({
          status: 'completed',
        })
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (PATCH) -> Update order with Editor role ', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}`)
        .send({
          status: 'completed',
        })
        .set('Authorization', `Bearer ${accessTokenEditor}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });
  });

  describe('Delete orders', () => {
    it('/orders (DELETE) -> Delete order with User role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body.message).toBe(
        `Order #${order.body.id} successfully removed`,
      );
    });

    it('/orders (DELETE) -> Delete order from another user', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .expect(404);

      expect(response.body.message).toBe('Order not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });

    it('/orders (DELETE) -> Delete order with Admin role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });

    it('/orders (DELETE) -> Delete order with Editor role', async () => {
      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          productIds: [`${product1.id}`, `${product2.id}`],
          status: 'pending',
        })
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${accessTokenEditor}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
    });
  });
});
