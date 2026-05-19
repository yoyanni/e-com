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

describe('Cart (e2e)', () => {
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

  describe('GET /cart', () => {
    it('401 — unauthenticated', async () => {
      await request(server).get('/cart').expect(401);
    });

    it('200 — empty cart returns empty array', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      const res = await request(server)
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('200 — returns cart items with product relation', async () => {
      const { accessToken, userId } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 2 });

      const res = await request(server)
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const products = res.body as any[];

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        id: expect.any(String) as string,
        userId,
        productId: product.id,
        quantity: 2,
        product: { id: product.id, name: 'Test Product' },
      });
    });
  });

  describe('POST /cart', () => {
    it('201 — adds a new cart item', async () => {
      const { accessToken, userId } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      const res = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String) as string,
        userId,
        productId: product.id,
        quantity: 1,
      });
    });

    it('201 — adding same product again upserts and increments quantity', async () => {
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

      const res = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 })
        .expect(201);

      expect((res.body as { quantity: number }).quantity).toBe(2);
    });

    it('404 — product does not exist', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
        })
        .expect(404);
    });

    it('400 — productId is not a UUID', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: 'not-a-uuid', quantity: 1 })
        .expect(400);
    });

    it('400 — quantity of 0 is rejected', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 0 })
        .expect(400);
    });

    it('401 — unauthenticated', async () => {
      const product = await seedProduct(dataSource);

      await request(server)
        .post('/cart')
        .send({ productId: product.id, quantity: 1 })
        .expect(401);
    });
  });

  describe('PATCH /cart/:itemId', () => {
    it('200 — updates quantity', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      const addRes = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const itemId = (addRes.body as { id: string }).id;

      const res = await request(server)
        .patch(`/cart/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect((res.body as { quantity: number }).quantity).toBe(5);
    });

    it('400 — quantity of 0 is rejected', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      const addRes = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const itemId = (addRes.body as { id: string }).id;

      await request(server)
        .patch(`/cart/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 0 })
        .expect(400);
    });

    it('400 — itemId is not a UUID', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .patch('/cart/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 5 })
        .expect(400);
    });

    it('404 — item does not exist', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .patch('/cart/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 5 })
        .expect(404);
    });

    it('404 — user cannot update another user cart item', async () => {
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

      const addRes = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const itemId = (addRes.body as { id: string }).id;

      await request(server)
        .patch(`/cart/${itemId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ quantity: 5 })
        .expect(404);
    });

    it('401 — unauthenticated', async () => {
      await request(server)
        .patch('/cart/00000000-0000-0000-0000-000000000000')
        .send({ quantity: 5 })
        .expect(401);
    });
  });

  describe('DELETE /cart/:itemId', () => {
    it('204 — removes item; cart is empty afterwards', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });
      const product = await seedProduct(dataSource);

      const addRes = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const itemId = (addRes.body as { id: string }).id;

      await request(server)
        .delete(`/cart/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const cartRes = await request(server)
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(cartRes.body).toEqual([]);
    });

    it('400 — itemId is not a UUID', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .delete('/cart/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('404 — item does not exist', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'User',
      });

      await request(server)
        .delete('/cart/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('404 — user cannot delete another user cart item', async () => {
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

      const addRes = await request(server)
        .post('/cart')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ productId: product.id, quantity: 1 });
      const itemId = (addRes.body as { id: string }).id;

      await request(server)
        .delete(`/cart/${itemId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(404);
    });

    it('401 — unauthenticated', async () => {
      await request(server)
        .delete('/cart/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });
});
