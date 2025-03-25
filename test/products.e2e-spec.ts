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
import * as request from 'supertest';
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

  describe('Create Product', () => {
    it('/product (POST) -> Create product with Admin role', async () => {
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
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
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

    it('/product (POST) -> Create product with Editor role', async () => {
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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

    it('/product (POST) -> Create create product with USER role', async () => {
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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.statusCode).toBe(403);
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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
        .set('Authorization', `Bearer ${accessTokenEditor}`)
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

    it('/products (GET) -> List Products', async () => {
      await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await productRepository.save({
        productName: 'product 2',
        description: 'description product 2',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .get('/products?page=0&perPage=2&sort=createdAt&sortDir=ASC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items[0].productName).toBe('product 1');
      expect(response.body.items[0].description).toBe('description product 1');
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.total).toBeDefined();
      expect(response.body.currentPage).toBe(1);
      expect(response.body.perPage).toBe(2);
      expect(response.body.sort).toBe('createdAt');
      expect(response.body.sortDir).toBe('ASC');
    });

    it('/products (GET) -> List Products Ordered by CreatedAt ASC', async () => {
      await productRepository.save({
        productName: 'product 1',
        description: 'description product ',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await new Promise((r) => setTimeout(r, 1000));

      await productRepository.save({
        productName: 'product 2',
        description: 'description product 2',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .get('/products?page=1&perPage=2&sort=createdAt&sortDir=ASC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const products = response.body.items;
      expect(products.length).toBeGreaterThan(1);
      expect(new Date(products[0].createdAt).getTime()).toBeLessThan(
        new Date(products[1].createdAt).getTime(),
      );
    });

    it('/products (GET) -> List Products Ordered by CreatedAt DESC', async () => {
      await productRepository.save({
        productName: 'product 1',
        description: 'description product ',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await new Promise((r) => setTimeout(r, 1000));

      await productRepository.save({
        productName: 'product 2',
        description: 'description product 2',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .get('/products?page=1&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const products = response.body.items;
      expect(products.length).toBeGreaterThan(1);
      expect(new Date(products[1].createdAt).getTime()).toBeLessThan(
        new Date(products[0].createdAt).getTime(),
      );
    });

    it('/products (GET) -> List Products Pagination', async () => {
      await productRepository.save({
        productName: 'product 1',
        description: 'description product ',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await new Promise((r) => setTimeout(r, 500));

      await productRepository.save({
        productName: 'product 2',
        description: 'description product 2',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await new Promise((r) => setTimeout(r, 500));

      await productRepository.save({
        productName: 'product 3',
        description: 'description product 3',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const responsePage1 = await request(app.getHttpServer())
        .get('/products?page=1&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const productsPage1 = responsePage1.body.items;
      expect(productsPage1.length).toBe(2);
      expect(new Date(productsPage1[0].createdAt).getTime()).toBeGreaterThan(
        new Date(productsPage1[1].createdAt).getTime(),
      );

      const responsePage2 = await request(app.getHttpServer())
        .get('/products?page=2&perPage=2&sort=createdAt&sortDir=DESC')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      const productsPage2 = responsePage2.body.items;
      expect(productsPage2.length).toBe(1);
      expect(productsPage2[0].productName).toBe('product 1');

      expect(productsPage1).not.toEqual(productsPage2);
    });
  });

  describe('Search products', () => {
    it('/products/:id (GET) -> Search product by ID', async () => {
      const product = await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
      expect(response.body.productName).toBe(product.productName);
      expect(response.body.description).toBe(product.description);
      expect(response.body.price).toStrictEqual(String(product.price));
      expect(response.body.quantityInStock).toBe(product.quantityInStock);
      expect(response.body.imageUrl).toBe(product.imageUrl);
      expect(response.body.rating).toBe(product.rating);
    });

    it('/products/:id (GET) -> Search product by ID not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/cebe75a5-f864-4275-b0d6-cec617e92126')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(404);

      expect(response.body.message).toBe('Product not found');
    });

    it('/products/:id (GET) -> Unauthorized', async () => {
      const nonExistentProductId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';

      const response = await request(app.getHttpServer())
        .get(`/products/${nonExistentProductId}`)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('Patch product', () => {
    it('/products/:id (PATCH) -> Update products', async () => {
      const product = await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ productName: 'Updated product 1' })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('/products/:id (PATCH) -> Unauthorized', async () => {
      const nonExistentProductId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';

      const response = await request(app.getHttpServer())
        .patch(`/products/${nonExistentProductId}`)
        .send({ productName: 'Updated product 1' })
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });

    it('/products/:id (PATCH) -> Request body with invalid data', async () => {
      const product = await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({
          productName: 'a',
          imageUrl: 'a',
        })
        .expect(422);

      expect(response.body.message).toContain('imageUrl must be a URL address');
      expect(response.body.message).toContain(
        'productName must be longer than or equal to 6 characters',
      );
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });
  });

  describe('Delete product', () => {
    it('/products/:id (DELETE) -> Remove product', async () => {
      const product = await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(404);
    });

    it('/products/:id (DELETE) -> Remove products with invalid token', async () => {
      const product = await productRepository.save({
        productName: 'product 1',
        description: 'description product 1',
        price: 1499.99,
        quantityInStock: 45,
        imageUrl: 'https://example.com/laptop-pro15.jpg',
        rating: 4.8,
      });

      const response = await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer token`)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });

    it('/products/:id (DELETE) -> Product not found', async () => {
      const nonExistentUserId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';
      const response = await request(app.getHttpServer())
        .delete(`/products/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .expect(404);

      expect(response.body.message).toBe('Product not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });
  });
});
