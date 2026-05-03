import { NotFoundException } from '@nestjs/common';
import { CartItem } from 'src/entities/cart-item.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Order } from 'src/entities/order.entity';
import { OrdersService } from './orders.service';

function makeOrdersRepo() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

function makeManager() {
  return {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
}

function makeDataSource(manager: ReturnType<typeof makeManager>) {
  return {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepo: ReturnType<typeof makeOrdersRepo>;
  let manager: ReturnType<typeof makeManager>;
  let dataSource: ReturnType<typeof makeDataSource>;

  const userId = 'user-1';
  const orderId = 'order-1';

  const mockProduct1 = { id: 'product-1', price: 10, stock: 5 };
  const mockProduct2 = { id: 'product-2', price: 25, stock: 3 };

  const mockCartItems = [
    {
      id: 'cart-item-1',
      userId,
      productId: mockProduct1.id,
      quantity: 2,
      product: mockProduct1,
    },
    {
      id: 'cart-item-2',
      userId,
      productId: mockProduct2.id,
      quantity: 1,
      product: mockProduct2,
    },
  ];

  const mockOrder = { id: orderId, userId, total: 45 };

  const mockOrderItems = [
    {
      orderId,
      productId: mockProduct1.id,
      quantity: 2,
      unitPrice: mockProduct1.price,
    },
    {
      orderId,
      productId: mockProduct2.id,
      quantity: 1,
      unitPrice: mockProduct2.price,
    },
  ];

  beforeEach(() => {
    ordersRepo = makeOrdersRepo();
    manager = makeManager();
    dataSource = makeDataSource(manager);

    service = new OrdersService(ordersRepo as any, dataSource as any);
  });

  describe('checkout', () => {
    it('should create an order, order items, and clear the cart', async () => {
      manager.find.mockResolvedValue(mockCartItems);
      manager.create
        .mockReturnValueOnce(mockOrder)
        .mockReturnValueOnce(mockOrderItems[0])
        .mockReturnValueOnce(mockOrderItems[1]);

      const result = await service.checkout(userId);

      expect(manager.find).toHaveBeenCalledWith(CartItem, {
        where: { userId },
        relations: ['product'],
      });

      expect(manager.create).toHaveBeenCalledWith(Order, { userId, total: 45 });
      expect(manager.save).toHaveBeenCalledWith(mockOrder);

      expect(manager.create).toHaveBeenCalledWith(OrderItem, mockOrderItems[0]);
      expect(manager.create).toHaveBeenCalledWith(OrderItem, mockOrderItems[1]);

      expect(manager.save).toHaveBeenCalledWith(mockOrderItems);

      expect(manager.remove).toHaveBeenCalledWith(mockCartItems);
      expect(result).toEqual(mockOrder);
    });

    it('should throw when the cart is empty', async () => {
      manager.find.mockResolvedValue([]);

      await expect(service.checkout(userId)).rejects.toThrow('Cart is empty');
    });

    it('should throw when some items are out of stock', async () => {
      const outOfStockItems = [
        {
          ...mockCartItems[0],
          quantity: 10,
        },
      ];
      manager.find.mockResolvedValue(outOfStockItems);

      await expect(service.checkout(userId)).rejects.toThrow(
        'Some items are out of stock',
      );
    });

    it('should succeed when item quantity equals stock exactly', async () => {
      const exactStockItems = [
        {
          ...mockCartItems[0],
          quantity: mockProduct1.stock,
        },
      ];
      const expectedTotal = mockProduct1.price * mockProduct1.stock;
      const order = {
        ...mockOrder,
        total: expectedTotal,
      };

      manager.find.mockResolvedValue(exactStockItems);
      manager.create.mockReturnValueOnce(order);

      const result = await service.checkout(userId);

      expect(manager.create).toHaveBeenCalledWith(Order, {
        userId,
        total: expectedTotal,
      });
      expect(result).toEqual(order);
    });
  });

  describe('findAll', () => {
    it('should return all orders for the user', async () => {
      const orders = [mockOrder, { id: 'order-2', userId, total: 100 }];
      ordersRepo.find.mockResolvedValue(orders);

      const result = await service.findAll(userId);

      expect(ordersRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['items', 'items.product'],
      });
      expect(result).toEqual(orders);
    });

    it('should return an empty array when the user has no orders', async () => {
      ordersRepo.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the order when found', async () => {
      ordersRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne(userId, orderId);

      expect(ordersRepo.findOne).toHaveBeenCalledWith({
        where: { id: orderId, userId },
        relations: ['items', 'items.product'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when the order does not exist', async () => {
      ordersRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
