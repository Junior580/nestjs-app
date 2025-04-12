/* eslint @typescript-eslint/no-unsafe-assignment: "off" */
/* eslint @typescript-eslint/no-unsafe-member-access: "off" */
/* eslint @typescript-eslint/no-unsafe-argument: "off" */

import {
  ClassSerializerInterceptor,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

import { AppModule } from '@/app.module';
import { GoogleAuthGuard } from '@/modules/auth/guards/google-auth.guard';
import { Order } from '@/modules/orders/entities/order.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AppDataSource } from '@/shared/infra/database/typeorm.config';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let userRepository: Repository<User>;
  let orderRepository: Repository<Order>;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();

    await AppDataSource.runMigrations();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            id: 'bd7f8fc0-6e76-4bc5-9c61-8d7f8a8ec9a4',
            email: 'test@example.com',
            name: 'Test User',
          };
          return true;
        },
      })
      .compile();

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

    await userRepository.save({
      name: 'user1test',
      email: 'user1test@email.com',
      password: await hash('password123', 6),
    });

    const auth = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'user1test@email.com',
        password: 'password123',
      })
      .expect(201);

    accessToken = auth.body.accessToken;
    refreshToken = auth.body.refreshToken;
    userId = auth.body.id;
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM "user"');
    await AppDataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await orderRepository.query('DELETE FROM "order_products"');
    await orderRepository.query('DELETE FROM "order"');
    await userRepository.query(
      'DELETE FROM "user" WHERE email != \'user1test@email.com\'',
    );
  });

  describe('Create user', () => {
    it('/auth/profile (GET) -> Get User Profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.role).toBe('USER');
    });

    it('/auth/signin (POST) -> Signin with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'user1test@email.com', password: 'password123' })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.id).toBeDefined();
    });

    it('/auth/signin (POST) -> Signin with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'wrongemail@email.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('/auth/refresh (POST) -> Refresh Token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.id).toBeDefined();
    });

    it('/auth/refresh (POST) -> Refresh Token with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer invalid_token`)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });

    it('/auth/refresh (POST) -> Logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const user = await userRepository.findOneBy({ id: userId });

      expect(user?.hashedRefreshToken).toBe(null);
    });

    it('/auth/google/signin/web (POST) -> Signin with valid google credentials', async () => {
      const response = await request(app.getHttpServer()).get(
        '/auth/google/callback',
      );
      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.id).toBe('bd7f8fc0-6e76-4bc5-9c61-8d7f8a8ec9a4');
    });
  });
});
