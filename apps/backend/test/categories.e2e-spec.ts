import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createApp, truncateTables, seedCategory } from './test-helpers';
import { Server } from 'http';

describe('Categories (e2e)', () => {
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
    await app.close();
  });

  describe('GET /categories', () => {
    it('200 — returns an empty array when no categories exist', async () => {
      const res = await request(server).get('/categories').expect(200);

      expect(res.body).toEqual([]);
    });

    it('200 — returns all seeded categories', async () => {
      await seedCategory(dataSource);

      const res = await request(server).get('/categories').expect(200);

      expect(res.body).toHaveLength(1);
      expect((res.body as any[])[0]).toMatchObject({
        id: expect.any(String) as string,
        name: 'Test Category',
        slug: 'test-category',
      });
    });

    it('200 — no auth required (public endpoint)', async () => {
      await request(server).get('/categories').expect(200);
    });
  });
});
