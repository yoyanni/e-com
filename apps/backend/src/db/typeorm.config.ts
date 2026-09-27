import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');

/**
 * SSL comes from the connection string (e.g. `?sslmode=require`), not from here.
 * Migrations never run on startup: use the `migration:run*` scripts.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, RefreshToken, Product, Category, CartItem, Order, OrderItem],
  synchronize: false,
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/db/migrations/*.js'
      : 'src/db/migrations/*.js',
  ],
});
