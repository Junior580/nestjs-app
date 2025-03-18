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

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/entities/user.entity';
import { AppDataSource } from '../src/shared/database/typeorm.config';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
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
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    await userRepository.clear();
    await app.close();
  });

  describe('Create user', () => {
    it('/users (POST) -> Create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test@email.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@email.com');

      testUser = response.body;
    });

    it('/users (POST) -> Create user with existing email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test1@email.com',
          password: 'password123',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Another User',
          email: 'test1@email.com',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.message).toBe('Email is already in use');
      expect(response.body.error).toBe('Conflict');
      expect(response.body.statusCode).toBe(409);
    });

    it('/users (POST) -> Create user with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Invalid Email User',
          email: 'invalid_email',
          password: 'password123',
        })
        .expect(422);

      expect(response.body.message).toContain('email must be an email');
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });
  });

  describe('Authenticate user', () => {
    it('/users/signin (POST) -> Authenticate user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          email: 'test@email.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('/users/signin (POST) -> Invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          email: 'invalid@email.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.statusCode).toBe(400);
    });

    it('/users/signin (POST) -> Request body with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(422);

      expect(response.body.message).toContain('email must be an email');
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });
  });

  describe('List users', () => {
    it('/users (GET) -> List Users with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });

    it('/users (GET) -> List Users (Authenticated)', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'list user',
          email: 'listUserRoute@email.com',
          password: 'password123',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(
          '/users?page=0&perPage=2&sort=createdAt&sortDir=ASC&filter=list user',
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items[0].name).toBe('list user');
      expect(response.body.items[0].email).toBe('listUserRoute@email.com');
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.total).toBeDefined();
      expect(response.body.currentPage).toBe(1);
      expect(response.body.perPage).toBe(2);
      expect(response.body.sort).toBe('createdAt');
      expect(response.body.sortDir).toBe('ASC');
    });
  });

  describe('Search user', () => {
    it('/users/:id (GET) -> Search user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
      expect(response.body.name).toBe(testUser.name);
      expect(response.body.email).toBe(testUser.email);
    });

    it('/users/:id (GET) -> Search user by ID not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/cebe75a5-f864-4275-b0d6-cec617e92126')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('/users/:id (GET) -> Unauthorized', async () => {
      const nonExistentUserId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';

      const response = await request(app.getHttpServer())
        .get(`/users/${nonExistentUserId}`)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('Patch user', () => {
    it('/users/:id (PATCH) -> Update user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated User' })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('/users/:id (PATCH) -> Unauthorized', async () => {
      const nonExistentUserId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';

      const response = await request(app.getHttpServer())
        .patch(`/users/${nonExistentUserId}`)
        .send({ name: 'Updated User' })
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(response.body.statusCode).toBe(401);
    });

    it('/users/:id (PATCH) -> Request body with invalid data', async () => {
      const invalidData = { email: 'invalid_email' };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.message).toContain('email must be an email');
      expect(response.body.error).toBe('Unprocessable Entity');
      expect(response.body.statusCode).toBe(422);
    });
  });

  describe('Delete user', () => {
    it('/users/:id (DELETE) -> Remove user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('/users/:id (GET) -> Check deleted user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('/users/:id (DELETE) -> Remove user with invalid token', async () => {
      const anotherUser = await userRepository.save({
        name: 'Another User',
        email: 'another@email.com',
        password: 'password123',
      });

      const response = await request(app.getHttpServer())
        .delete(`/users/${anotherUser.id}`)
        .set('Authorization', `Bearer token`)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });

    it('/users/:id (DELETE) -> User not found', async () => {
      const nonExistentUserId = '8b7df35f-5198-46c3-a8fd-d147c06167ac';
      const response = await request(app.getHttpServer())
        .delete(`/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Espera erro 404

      expect(response.body.message).toBe('User not found');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });
  });
});
