/* eslint @typescript-eslint/no-unsafe-assignment: "off" */
/* eslint @typescript-eslint/no-unsafe-member-access: "off" */
/* eslint @typescript-eslint/no-unsafe-argument: "off" */

import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
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

  it('/users (GET) -> List Users (Authenticated)', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/users/:id (GET) -> Search user by ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.id).toBe(testUser.id);
    expect(response.body.name).toBe(testUser.name);
    expect(response.body.email).toBe(testUser.email);
  });

  it('/users/:id (PATCH) -> Update user', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated User' })
      .expect(204);

    expect(response.body).toEqual({});
  });

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
});
