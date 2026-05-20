import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { type Server } from 'http';
import {
  createApp,
  truncateTables,
  registerAndLogin,
  seedProduct,
} from './test-helpers';

describe('Orders (e2e)', () => {
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

  describe('POST /orders/checkout', () => {
    it('400 — empty cart', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('400 — out-of-stock item', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource, { stock: 0 });

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });

      await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('201 — creates order and returns it with correct total', async () => {
      const { accessToken, userId } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource, { price: 10 });

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 2 });

      const res = await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String) as string,
        userId,
        status: 'pending',
      });
      expect(parseFloat((res.body as { total: string }).total)).toBe(20);
    });

    it('201 — cart is cleared after checkout', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });

      await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const cartRes = await request(server)
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(cartRes.body).toEqual([]);
    });

    it('401 — unauthenticated', async () => {
      await request(server).post('/orders/checkout').expect(401);
    });
  });

  describe('GET /orders', () => {
    it('200 — empty list before any checkout', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      const res = await request(server)
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('200 — returns orders with items and nested product', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(server)
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const orders = res.body as any[];

      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: expect.any(String) as string,
        status: 'pending',
        items: [
          {
            id: expect.any(String) as string,
            productId: product.id,
            quantity: 1,
            product: { id: product.id, name: 'Test Product' },
          },
        ],
      });
    });

    it('200 — only returns the authenticated user orders', async () => {
      const userA = await registerAndLogin(app, {
        email: 'usera@test.com',
        password: 'password123',
        name: 'User A',
      });
      const userB = await registerAndLogin(app, {
        email: 'userb@test.com',
        password: 'password123',
        name: 'User B',
      });
      const product = await seedProduct(dataSource);

      // Only user A checks out
      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const res = await request(server)
        .get('/orders')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('401 — unauthenticated', async () => {
      await request(server).get('/orders').expect(401);
    });
  });

  describe('GET /orders/:id', () => {
    it('200 — returns own order with items and nested product', async () => {
      const { accessToken, userId } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource, { price: 25 });

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 3 });
      const checkoutRes = await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`);
      const orderId = (checkoutRes.body as { id: string }).id;

      const res = await request(server)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: orderId,
        userId,
        status: 'pending',
        items: [
          {
            productId: product.id,
            quantity: 3,
            product: { id: product.id },
          },
        ],
      });
      expect(parseFloat((res.body as { total: string }).total)).toBe(75);
    });

    it('404 — order does not exist', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('404 — user cannot access another user order', async () => {
      const userA = await registerAndLogin(app, {
        email: 'usera@test.com',
        password: 'password123',
        name: 'User A',
      });
      const userB = await registerAndLogin(app, {
        email: 'userb@test.com',
        password: 'password123',
        name: 'User B',
      });
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const checkoutRes = await request(server)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${userA.accessToken}`);
      const orderId = (checkoutRes.body as { id: string }).id;

      await request(server)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(404);
    });

    it('401 — unauthenticated', async () => {
      await request(server)
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });
});
