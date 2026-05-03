import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';

function makeCartItemRepo() {
  return {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function makeProductRepo() {
  return {
    findOneBy: jest.fn(),
  };
}

describe('CartService', () => {
  let service: CartService;
  let cartItemRepo: ReturnType<typeof makeCartItemRepo>;
  let productRepo: ReturnType<typeof makeProductRepo>;

  const userId = 'user-1';

  beforeEach(() => {
    cartItemRepo = makeCartItemRepo();
    productRepo = makeProductRepo();

    service = new CartService(cartItemRepo as any, productRepo as any);
  });

  describe('getCart', () => {
    const mockCartItems = [
      {
        id: 'cart-item-1',
        userId,
        productId: 'product-1',
        quantity: 2,
      },
      {
        id: 'cart-item-2',
        userId,
        productId: 'product-2',
        quantity: 1,
      },
    ];

    it('should return cart items with product details', async () => {
      cartItemRepo.find.mockResolvedValue(mockCartItems);

      const result = await service.getCart(userId);
      expect(cartItemRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['product'],
      });
      expect(result).toEqual(mockCartItems);
    });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', async () => {
      const dto = { productId: 'product-3', quantity: 3 };
      const newCartItem = {
        id: 'cart-item-3',
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      };

      productRepo.findOneBy.mockResolvedValue({ id: dto.productId });
      cartItemRepo.findOneBy.mockResolvedValue(null);
      cartItemRepo.create.mockReturnValue(newCartItem);
      cartItemRepo.save.mockResolvedValue(newCartItem);

      const result = await service.addItem(userId, dto);

      expect(productRepo.findOneBy).toHaveBeenCalledWith({ id: dto.productId });
      expect(cartItemRepo.findOneBy).toHaveBeenCalledWith({
        userId,
        productId: dto.productId,
      });
      expect(cartItemRepo.create).toHaveBeenCalledWith({
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      });
      expect(cartItemRepo.save).toHaveBeenCalledWith(newCartItem);
      expect(result).toEqual(newCartItem);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.addItem(userId, { productId: 'bad-id', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should increment quantity when item already exists in cart', async () => {
      const dto = { productId: 'product-1', quantity: 2 };
      const existingItem = {
        id: 'cart-item-1',
        userId,
        productId: dto.productId,
        quantity: 3,
      };
      const updatedItem = { ...existingItem, quantity: 5 };

      productRepo.findOneBy.mockResolvedValue({ id: dto.productId });
      cartItemRepo.findOneBy.mockResolvedValue(existingItem);
      cartItemRepo.save.mockResolvedValue(updatedItem);

      const result = await service.addItem(userId, dto);

      expect(cartItemRepo.create).not.toHaveBeenCalled();
      expect(cartItemRepo.save).toHaveBeenCalledWith({
        ...existingItem,
        quantity: 5,
      });
      expect(result).toEqual(updatedItem);
    });
  });

  describe('updateItem', () => {
    it('should update the quantity of an existing cart item', async () => {
      const itemId = 'cart-item-1';
      const dto = { quantity: 5 };
      const existingItem = {
        id: itemId,
        userId,
        productId: 'product-1',
        quantity: 2,
      };
      const updatedItem = { ...existingItem, quantity: 5 };

      cartItemRepo.findOneBy.mockResolvedValue(existingItem);
      cartItemRepo.save.mockResolvedValue(updatedItem);

      const result = await service.updateItem(userId, itemId, dto);

      expect(cartItemRepo.findOneBy).toHaveBeenCalledWith({
        id: itemId,
        userId,
      });
      expect(cartItemRepo.save).toHaveBeenCalledWith({
        ...existingItem,
        quantity: 5,
      });
      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException when cart item does not exist', async () => {
      cartItemRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateItem(userId, 'bad-id', { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing cart item', async () => {
      const itemId = 'cart-item-1';
      const existingItem = {
        id: itemId,
        userId,
        productId: 'product-1',
        quantity: 2,
      };

      cartItemRepo.findOneBy.mockResolvedValue(existingItem);
      cartItemRepo.delete.mockResolvedValue(undefined);

      const result = await service.deleteItem(userId, itemId);

      expect(cartItemRepo.findOneBy).toHaveBeenCalledWith({
        id: itemId,
        userId,
      });
      expect(cartItemRepo.delete).toHaveBeenCalledWith(itemId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when cart item does not exist', async () => {
      cartItemRepo.findOneBy.mockResolvedValue(null);

      await expect(service.deleteItem(userId, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(cartItemRepo.delete).not.toHaveBeenCalled();
    });
  });
});
