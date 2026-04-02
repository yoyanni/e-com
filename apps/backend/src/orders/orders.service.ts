import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from 'src/entities/cart-item.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Order } from 'src/entities/order.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async checkout(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const cartItems = await manager.find(CartItem, {
        where: { userId: userId },
        relations: ['product'],
      });

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const outofStockItems = cartItems.filter(
        (item) => item.quantity > item.product.stock,
      );

      if (outofStockItems.length > 0) {
        throw new Error('Some items are out of stock');
      }

      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      const order = manager.create(Order, { userId, total });
      await manager.save(order);

      const orderItems = cartItems.map((item) =>
        manager.create(OrderItem, {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        }),
      );
      await manager.save(orderItems);

      await manager.remove(cartItems);

      return order;
    });
  }

  async findAll(userId: string) {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
    });
  }

  async findOne(userId: string, id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }
    return order;
  }
}
