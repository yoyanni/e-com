import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product, CartItem, Order, OrderItem],
});

const NUM_CATEGORIES = 10;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seed() {
  const { faker } = await import('@faker-js/faker');

  await dataSource.initialize();
  console.log('Connected to database');

  const categoryRepo = dataSource.getRepository(Category);

  // Clear existing categories
  await categoryRepo.createQueryBuilder().delete().from(Category).execute();
  console.log('Cleared categories table');

  // Seed categories
  const uniqueNames = faker.helpers.uniqueArray(
    () => faker.commerce.department(),
    NUM_CATEGORIES,
  );
  const categories = uniqueNames.map((name) =>
    categoryRepo.create({ name, slug: slugify(name) }),
  );
  await categoryRepo.save(categories);
  console.log(`Seeded ${categories.length} categories`);

  await dataSource.destroy();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
