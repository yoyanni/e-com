import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { type Server } from 'http';
import {
  createApp,
  truncateTables,
  seedCategory,
  seedProduct,
  loginAsAdmin,
  registerAndLogin,
} from './test-helpers';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createApp());
    server = app.getHttpServer() as Server;
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /products', () => {
    it('200 — empty database returns empty paginated response', async () => {
      const res = await request(server).get('/products').expect(200);

      expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 24 });
    });

    it('200 — returns seeded product with correct shape', async () => {
      await seedProduct(dataSource);

      const res = await request(server).get('/products').expect(200);

      const { total, data } = res.body as { total: number; data: any[] };

      expect(total).toBe(1);
      expect(data[0]).toMatchObject({
        id: expect.any(String) as string,
        name: 'Test Product',
        slug: 'test-product',
        stock: 10,
      });
    });

    it('200 — ?search matches by product name (case-insensitive)', async () => {
      await seedProduct(dataSource);

      const matchRes = await request(server)
        .get('/products?search=test')
        .expect(200);

      const { total } = matchRes.body as { total: number };
      expect(total).toBe(1);

      const noMatchRes = await request(server)
        .get('/products?search=nomatch')
        .expect(200);
      const { total: noMatchTotal, data: noMatchData } = noMatchRes.body as {
        total: number;
        data: any[];
      };
      expect(noMatchTotal).toBe(0);
      expect(noMatchData).toEqual([]);
    });

    it('200 — ?category filters by category slug', async () => {
      const category = await seedCategory(dataSource);
      await seedProduct(dataSource, { categoryId: category.id });
      await seedProduct(dataSource, { slug: 'product-no-cat' }); // no category

      const res = await request(server)
        .get('/products?category=test-category')
        .expect(200);

      const { total, data } = res.body as {
        total: number;
        data: { slug: string }[];
      };
      expect(total).toBe(1);
      expect(data[0].slug).toBe('test-product');
    });

    it('200 — ?minPrice and ?maxPrice filter by price range', async () => {
      await seedProduct(dataSource, { price: 15, slug: 'cheap-product' });
      await seedProduct(dataSource, { price: 50, slug: 'pricey-product' });

      const res = await request(server)
        .get('/products?minPrice=10&maxPrice=20')
        .expect(200);

      const { total, data } = res.body as {
        total: number;
        data: { slug: string }[];
      };
      expect(total).toBe(1);
      expect(data[0].slug).toBe('cheap-product');
    });

    it('200 — ?sort=price_asc orders cheapest first', async () => {
      await seedProduct(dataSource, { price: 50, slug: 'product-a' });
      await seedProduct(dataSource, { price: 10, slug: 'product-b' });

      const res = await request(server)
        .get('/products?sort=price_asc')
        .expect(200);

      const { data } = res.body as { data: { price: string }[] };

      expect(parseFloat(data[0].price)).toBeLessThanOrEqual(
        parseFloat(data[1].price),
      );
    });

    it('200 — ?sort=price_desc orders most expensive first', async () => {
      await seedProduct(dataSource, { price: 10, slug: 'product-a' });
      await seedProduct(dataSource, { price: 50, slug: 'product-b' });

      const res = await request(server)
        .get('/products?sort=price_desc')
        .expect(200);

      const { data } = res.body as { data: { price: string }[] };
      expect(parseFloat(data[0].price)).toBeGreaterThanOrEqual(
        parseFloat(data[1].price),
      );
    });

    it('200 — ?page and ?limit paginate results', async () => {
      await seedProduct(dataSource, { slug: 'product-a' });
      await seedProduct(dataSource, { slug: 'product-b' });

      const res = await request(server)
        .get('/products?page=2&limit=1')
        .expect(200);

      const { data, total, page, limit } = res.body as {
        data: { slug: string }[];
        total: number;
        page: number;
        limit: number;
      };
      expect(data).toHaveLength(1);
      expect(total).toBe(2);
      expect(page).toBe(2);
      expect(limit).toBe(1);
    });
  });

  describe('GET /products/:slug', () => {
    it('200 — returns product with category relation', async () => {
      const category = await seedCategory(dataSource);
      await seedProduct(dataSource, { categoryId: category.id });

      const res = await request(server)
        .get('/products/test-product')
        .expect(200);

      expect(res.body).toMatchObject({
        id: expect.any(String) as string,
        name: 'Test Product',
        slug: 'test-product',
        stock: 10,
        category: {
          id: category.id,
          name: 'Test Category',
          slug: 'test-category',
        },
      });
    });

    it('404 — non-existent slug', async () => {
      await request(server)
        .get('/products/slug-that-does-not-exist')
        .expect(404);
    });
  });

  describe('POST /products', () => {
    it('201 as admin — slug auto-generated from name', async () => {
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Widget', price: 9.99 })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String) as string,
        name: 'New Widget',
        slug: 'new-widget',
      });
    });

    it('201 — slug collision appends numeric suffix', async () => {
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Widget', price: 9.99 })
        .expect(201);

      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Widget', price: 9.99 })
        .expect(201);

      expect((res.body as { slug: string }).slug).toBe('new-widget-1');
    });

    it('403 as customer', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'customer@test.com',
        password: 'password123',
        name: 'Customer',
      });

      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Widget', price: 9.99 })
        .expect(403);
    });

    it('401 unauthenticated', async () => {
      await request(server)
        .post('/products')
        .send({ name: 'New Widget', price: 9.99 })
        .expect(401);
    });

    it('400 — missing required name', async () => {
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 9.99 })
        .expect(400);
    });

    it('400 — non-positive price', async () => {
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad Price', price: -5 })
        .expect(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('200 as admin — updated field reflected in response', async () => {
      const product = await seedProduct(dataSource);
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      const res = await request(server)
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(200);

      expect(parseFloat((res.body as { price: string }).price)).toBe(99.99);
    });

    it('403 as customer', async () => {
      const product = await seedProduct(dataSource);
      const { accessToken } = await registerAndLogin(app, {
        email: 'customer@test.com',
        password: 'password123',
        name: 'Customer',
      });

      await request(server)
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 99.99 })
        .expect(403);
    });

    it('401 unauthenticated', async () => {
      const product = await seedProduct(dataSource);

      await request(server)
        .patch(`/products/${product.id}`)
        .send({ price: 99.99 })
        .expect(401);
    });

    it('404 — non-existent product id', async () => {
      const adminToken = await loginAsAdmin(app, dataSource, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });

      await request(server)
        .patch('/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(404);
    });
  });
});
