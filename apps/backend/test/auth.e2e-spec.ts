import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { type Server } from 'http';
import {
  createApp,
  truncateTables,
  registerAndLogin,
  makeAdmin,
} from './test-helpers';

describe('Auth (e2e)', () => {
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

  describe('POST /auth/register', () => {
    it('201 — returns accessToken and refreshToken', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({
          email: 'user@test.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String) as string,
        refreshToken: expect.any(String) as string,
      });
    });

    it('409 — duplicate email', async () => {
      const body = {
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      };
      await request(server).post('/auth/register').send(body).expect(201);
      await request(server).post('/auth/register').send(body).expect(409);
    });

    it('400 — malformed email', async () => {
      await request(server)
        .post('/auth/register')
        .send({
          email: 'notanemail',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);
    });

    it('400 — password shorter than 8 characters', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'user@test.com', password: 'short', name: 'Test User' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(server).post('/auth/register').send({
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('200 — returns accessToken and refreshToken', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' })
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String) as string,
        refreshToken: expect.any(String) as string,
      });
    });

    it('401 — wrong password', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('401 — email not registered', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('200 — returns user id, email and role', async () => {
      const { accessToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      });

      const res = await request(server)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: expect.any(String) as string,
        email: 'user@test.com',
        role: 'customer',
      });
    });

    it('401 — no Authorization header', async () => {
      await request(server).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('200 — returns a new token pair; refresh token is rotated', async () => {
      const { refreshToken: originalRefreshToken } = await registerAndLogin(
        app,
        {
          email: 'user@test.com',
          password: 'password123',
          name: 'Test User',
        },
      );

      const res = await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String) as string,
        refreshToken: expect.any(String) as string,
      });
      expect((res.body as { refreshToken: string }).refreshToken).not.toBe(
        originalRefreshToken,
      );
    });

    it('401 — unknown/random token', async () => {
      await request(server)
        .post('/auth/refresh')
        .send({
          refreshToken:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        })
        .expect(401);
    });

    it('401 — reuse detection invalidates entire token family', async () => {
      // Step 1: register and get RT1
      const { refreshToken: rt1 } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      });

      // Step 2: rotate RT1 → receive RT2 (RT1 is now revoked)
      const rotateRes = await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: rt1 })
        .expect(200);
      const rt2 = (rotateRes.body as { refreshToken: string }).refreshToken;

      // Step 3: reuse RT1 → 401, family invalidated
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: rt1 })
        .expect(401);

      // Step 4: RT2 is in the same family — also revoked now
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: rt2 })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('204 — revokes the refresh token', async () => {
      const { refreshToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      });

      await request(server)
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204);
    });

    it('204 — no-op for an unknown token', async () => {
      await request(server)
        .post('/auth/logout')
        .send({
          refreshToken:
            'totallyrandomtokenthatdoesnotexistinthedatabase00000000000000000000000000000000000000000000000000000000000000000000000000000000',
        })
        .expect(204);
    });

    it('401 — refresh after logout is rejected', async () => {
      const { refreshToken } = await registerAndLogin(app, {
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
      });

      await request(server)
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204);

      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('PATCH /auth/users/:id/role', () => {
    it('204 — admin can change another user role', async () => {
      const admin = await registerAndLogin(app, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });
      const target = await registerAndLogin(app, {
        email: 'target@test.com',
        password: 'password123',
        name: 'Target',
      });

      await makeAdmin(dataSource, admin.userId);
      // Re-login so the new access token carries role: admin in its payload
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      const adminToken = (loginRes.body as { accessToken: string }).accessToken;

      await request(server)
        .patch(`/auth/users/${target.userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(204);
    });

    it('403 — customer cannot change roles', async () => {
      const customer = await registerAndLogin(app, {
        email: 'customer@test.com',
        password: 'password123',
        name: 'Customer',
      });
      const target = await registerAndLogin(app, {
        email: 'target@test.com',
        password: 'password123',
        name: 'Target',
      });

      await request(server)
        .patch(`/auth/users/${target.userId}/role`)
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });

    it('401 — unauthenticated request', async () => {
      await request(server)
        .patch('/auth/users/00000000-0000-0000-0000-000000000000/role')
        .send({ role: 'admin' })
        .expect(401);
    });

    it('400 — admin cannot change own role', async () => {
      const admin = await registerAndLogin(app, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });
      await makeAdmin(dataSource, admin.userId);
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      const adminToken = (loginRes.body as { accessToken: string }).accessToken;

      await request(server)
        .patch(`/auth/users/${admin.userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'customer' })
        .expect(400);
    });

    it('404 — target user does not exist', async () => {
      const admin = await registerAndLogin(app, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin',
      });
      await makeAdmin(dataSource, admin.userId);
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      const adminToken = (loginRes.body as { accessToken: string }).accessToken;

      await request(server)
        .patch('/auth/users/00000000-0000-0000-0000-000000000000/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'customer' })
        .expect(404);
    });
  });
});
