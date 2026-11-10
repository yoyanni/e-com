import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Category } from '../src/entities/category.entity';
import { Product } from '../src/entities/product.entity';
import { type Server } from 'http';

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

  try {
    await assertTestDatabase(dataSource);
  } catch (error) {
    await app.close();
    throw error;
  }

  return { app, dataSource };
}

/**
 * The e2e suite truncates every table before every test. Refuse to touch a
 * database whose name doesn't end in `_test`, so that running jest without
 * `--env-file=.env.test` (which falls back to `.env`) can't wipe the dev database.
 */
async function assertTestDatabase(dataSource: DataSource): Promise<void> {
  const [{ name }] = await dataSource.query<{ name: string }[]>(
    'SELECT current_database() AS name',
  );
  if (!name.endsWith('_test')) {
    throw new Error(
      `\n\n*** REFUSING TO RUN E2E TESTS AGAINST DATABASE "${name}" ***\n` +
        'The e2e suite truncates every table, and it only runs against a database whose name ends in "_test".\n' +
        'Jest was probably started without apps/backend/.env.test, so DATABASE_URL came from .env.\n' +
        'Run the suite with `npm run test:e2e:backend`.\n',
    );
  }
}

export async function truncateTables(dataSource: DataSource): Promise<void> {
  await assertTestDatabase(dataSource);
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

export async function loginAsAdmin(
  app: INestApplication,
  dataSource: DataSource,
  creds: { email: string; password: string; name: string },
): Promise<string> {
  const { userId } = await registerAndLogin(app, creds);
  await makeAdmin(dataSource, userId);
  const loginRes = await request(app.getHttpServer() as Server)
    .post('/auth/login')
    .send({ email: creds.email, password: creds.password });
  return (loginRes.body as { accessToken: string }).accessToken;
}

export async function seedCategory(dataSource: DataSource): Promise<Category> {
  return dataSource.getRepository(Category).save({
    name: 'Test Category',
    slug: 'test-category',
  });
}

export async function seedProduct(
  dataSource: DataSource,
  overrides?: Partial<{
    name: string;
    slug: string;
    price: number;
    stock: number;
    categoryId: string | null;
  }>,
): Promise<Product> {
  return dataSource.getRepository(Product).save({
    name: 'Test Product',
    slug: 'test-product',
    price: 29.99,
    stock: 10,
    categoryId: null,
    ...overrides,
  });
}
