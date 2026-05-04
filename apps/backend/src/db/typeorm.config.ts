import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

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
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  migrationsRun: true,
});
