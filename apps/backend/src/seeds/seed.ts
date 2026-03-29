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
const NUM_PRODUCTS = 50;

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
  const productRepo = dataSource.getRepository(Product);

  // Clear existing data (products first due to FK)
  await productRepo.createQueryBuilder().delete().from(Product).execute();
  console.log('Cleared products table');
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

  // Seed products
  const usedSlugs = new Set<string>();
  const products = Array.from({ length: NUM_PRODUCTS }, () => {
    const name = faker.commerce.productName();
    let slug = slugify(name);
    while (usedSlugs.has(slug)) {
      slug = slugify(`${name}-${faker.string.alphanumeric(4)}`);
    }
    usedSlugs.add(slug);

    return productRepo.create({
      name,
      slug,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      imageUrl: faker.image.url(),
      categoryId: faker.helpers.arrayElement(categories).id,
    });
  });
  await productRepo.save(products);
  console.log(`Seeded ${products.length} products`);

  await dataSource.destroy();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
