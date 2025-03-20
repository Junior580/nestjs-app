/* eslint @typescript-eslint/no-unsafe-assignment: "off" */
/* eslint @typescript-eslint/no-unsafe-member-access: "off" */
/* eslint @typescript-eslint/no-unsafe-argument: "off" */

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
import { Product } from '@/modules/products/entities/product.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AppDataSource } from '@/shared/infra/database/typeorm.config';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orderRepository: Repository<Product>;
  let accessToken: string;

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

    orderRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'user1test',
        email: 'user1test@email.com',
        password: 'password123',
      })
      .expect(201);

    const auth = await request(app.getHttpServer())
      .post('/users/signin')
      .send({
        email: 'user1test@email.com',
        password: 'password123',
      })
      .expect(201);

    accessToken = auth.body.accessToken;
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await orderRepository.query('DELETE FROM "order_products"');
    await orderRepository.query('DELETE FROM "product"');
    await userRepository.query('DELETE FROM "user"');
  });

  describe('Create Product', () => {
    it('/product (POST) -> Create product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          productName: 'product 1',
          description: 'description product 1',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.productName).toBe('product 1');
      expect(response.body.description).toBe('description product 1');
      expect(response.body.price).toBe(1499.99);
      expect(response.body.quantityInStock).toBe(45);
      expect(response.body.imageUrl).toBe(
        'https://example.com/laptop-pro15.jpg',
      );
      expect(response.body.rating).toBe(4.8);
    });

    it('/product (POST) -> Create product with existing name', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          productName: 'product 1',
          description: 'description product 1',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'product 1',
          description: 'description product 1',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .expect(409);

      expect(response.body.message).toBe('Product already exists');
      expect(response.body.error).toBe('Conflict');
      expect(response.body.statusCode).toBe(409);
    });

    it('/product (POST) -> Create product with invalid name', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'aaaaa',
          description: 'description product 1',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .expect(422);

      expect(response.body.message).toContain(
        'productName must be longer than or equal to 6 characters',
      );
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });

    it('/products (POST) -> Create product with negative price', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'Valid Name',
          description: 'Valid description',
          price: -100,
          quantityInStock: 10,
          imageUrl: 'https://example.com/product.jpg',
          rating: 4.5,
        })
        .expect(422);

      expect(response.body.message).toContain(
        'price must be a positive number',
      );
    });

    it('/products (POST) -> Create product with zero quantity in stock', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'Valid Name',
          description: 'Valid description',
          price: 299.99,
          quantityInStock: 0,
          imageUrl: 'https://example.com/product.jpg',
          rating: 4.5,
        })
        .expect(422);

      expect(response.body.message).toContain(
        'quantityInStock must be a positive number',
      );
    });

    it('/products (POST) -> Create product with invalid image URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'Valid Name',
          description: 'Valid description',
          price: 499.99,
          quantityInStock: 5,
          imageUrl: 'invalid-url',
          rating: 4.2,
        })
        .expect(422);

      expect(response.body.message).toContain('imageUrl must be a URL address');
    });

    it('/products (POST) -> Create product with non-numeric rating', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productName: 'Valid Name',
          description: 'Valid description',
          price: 599.99,
          quantityInStock: 15,
          imageUrl: 'https://example.com/product.jpg',
          rating: 'high',
        })
        .expect(422);

      expect(response.body.message).toContain(
        'rating must be a number conforming to the specified constraints',
      );
    });
  });

  describe('List products', () => {
    it('/products (GET) -> List Products with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });

    it('/products (GET) -> List Products (Authenticated)', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          productName: 'product 1',
          description: 'description product 1',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post('/products')
        .send({
          productName: 'product 2',
          description: 'description product 2',
          price: 1499.99,
          quantityInStock: 45,
          imageUrl: 'https://example.com/laptop-pro15.jpg',
          rating: 4.8,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body[0].productName).toBe('product 1');
      expect(response.body[0].description).toBe('description product 1');
      expect(response.body.length).toBeGreaterThan(0);
      // expect(response.body.total).toBeDefined();
      // expect(response.body.currentPage).toBe(1);
      // expect(response.body.perPage).toBe(2);
      // expect(response.body.sort).toBe('createdAt');
      // expect(response.body.sortDir).toBe('ASC');
    });

    // it('/products (GET) -> List products Ordered by CreatedAt ASC', async () => {
    //   await request(app.getHttpServer())
    //     .post('/products')
    //     .send({
    //     })
    //     .expect(201);
    //
    //   await new Promise((r) => setTimeout(r, 1000));
    //
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user2',
    //       email: 'user2@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   const response = await request(app.getHttpServer())
    //     .get('/users?page=1&perPage=2&sort=createdAt&sortDir=ASC')
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    //
    //   const users = response.body.items;
    //   expect(users.length).toBeGreaterThan(1);
    //   expect(new Date(users[0].createdAt).getTime()).toBeLessThan(
    //     new Date(users[1].createdAt).getTime(),
    //   );
    // });

    // it('/users (GET) -> List Users Ordered by CreatedAt DESC', async () => {
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user1',
    //       email: 'user1@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   await new Promise((r) => setTimeout(r, 1000));
    //
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user2',
    //       email: 'user2@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   const response = await request(app.getHttpServer())
    //     .get('/users?page=1&perPage=2&sort=createdAt&sortDir=DESC')
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    //
    //   const users = response.body.items;
    //   expect(users.length).toBeGreaterThan(1);
    //   expect(new Date(users[1].createdAt).getTime()).toBeLessThan(
    //     new Date(users[0].createdAt).getTime(),
    //   );
    // });
    //
    // it('/users (GET) -> List Users Pagination', async () => {
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user1',
    //       email: 'user1@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   await new Promise((r) => setTimeout(r, 500));
    //
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user2',
    //       email: 'user2@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   await new Promise((r) => setTimeout(r, 500));
    //
    //   await request(app.getHttpServer())
    //     .post('/users')
    //     .send({
    //       name: 'user3',
    //       email: 'user3@email.com',
    //       password: 'password123',
    //     })
    //     .expect(201);
    //
    //   const responsePage1 = await request(app.getHttpServer())
    //     .get('/users?page=1&perPage=2&sort=createdAt&sortDir=DESC')
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    //
    //   const usersPage1 = responsePage1.body.items;
    //   expect(usersPage1.length).toBe(2);
    //   expect(new Date(usersPage1[0].createdAt).getTime()).toBeGreaterThan(
    //     new Date(usersPage1[1].createdAt).getTime(),
    //   );
    //
    //   const responsePage2 = await request(app.getHttpServer())
    //     .get('/users?page=2&perPage=2&sort=createdAt&sortDir=DESC')
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    //
    //   const usersPage2 = responsePage2.body.items;
    //   expect(usersPage2.length).toBe(1);
    //   expect(usersPage2[0].name).toBe('user1');
    //
    //   expect(usersPage1).not.toEqual(usersPage2);
    // });
  });
});
