import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Category } from '../src/entities/category.entity';
import { Product } from '../src/entities/product.entity';
import { Server } from 'https';

export async function createApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);

  return { app, dataSource };
}

export async function truncateTables(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE cart_items, order_items, orders, refresh_tokens, users, products, categories RESTART IDENTITY CASCADE',
  );
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export async function registerAndLogin(
  app: INestApplication,
  creds: { email: string; password: string; name: string },
): Promise<AuthTokens> {
  const server = app.getHttpServer() as Server;
  const registerRes = await request(server)
    .post('/auth/register')
    .send(creds)
    .expect(201);

  const { accessToken, refreshToken } = registerRes.body as {
    accessToken: string;
    refreshToken: string;
  };

  const meRes = await request(server)
    .get('/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  return {
    accessToken,
    refreshToken,
    userId: (meRes.body as { id: string }).id,
  };
}

export async function makeAdmin(
  dataSource: DataSource,
  userId: string,
): Promise<void> {
  await dataSource.query("UPDATE users SET role = 'admin' WHERE id = $1", [
    userId,
  ]);
}

export async function seedCategory(dataSource: DataSource): Promise<Category> {
  return dataSource.getRepository(Category).save({
    name: 'Test Category',
    slug: 'test-category',
  });
}

export async function seedProduct(
  dataSource: DataSource,
  categoryId?: string,
): Promise<Product> {
  return dataSource.getRepository(Product).save({
    name: 'Test Product',
    slug: 'test-product',
    price: 29.99,
    stock: 10,
    categoryId: categoryId ?? null,
  });
}
