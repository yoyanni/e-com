import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from 'src/entities/cart-item.entity';
import { Product } from 'src/entities/product.entity';
import { Repository } from 'typeorm';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getCart(userId: string) {
    const cartItems = await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
    });
    return cartItems;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.productRepository.findOneBy({
      id: dto.productId,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.cartItemRepository.findOneBy({
      userId,
      productId: dto.productId,
    });

    if (existing) {
      existing.quantity += dto.quantity;
      return this.cartItemRepository.save(existing);
    }

    const cartItem = this.cartItemRepository.create({
      userId,
      productId: dto.productId,
      quantity: dto.quantity,
    });
    return this.cartItemRepository.save(cartItem);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cartItem = await this.cartItemRepository.findOneBy({
      id: itemId,
      userId,
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = dto.quantity;
    return this.cartItemRepository.save(cartItem);
  }

  async deleteItem(userId: string, itemId: string) {
    const cartItem = await this.cartItemRepository.findOneBy({
      id: itemId,
      userId,
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.delete(itemId);
  }
}
