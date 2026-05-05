import 'reflect-metadata';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { slugify } from '../../utils/slugify';
import AppDataSource from '../typeorm.config';

const NUM_CATEGORIES = 10;
const NUM_PRODUCTS = 50;

async function seed() {
  const { faker } = await import('@faker-js/faker');

  await AppDataSource.initialize();
  console.log(
    `Connected to ${process.env.NODE_ENV === 'production' ? 'PROD' : 'NON-PROD'} database`,
  );

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);

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
    let suffix = 1;
    while (usedSlugs.has(slug)) {
      slug = slugify(`${name}-${suffix++}`);
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

  await AppDataSource.destroy();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
