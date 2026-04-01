import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from 'src/entities/cart-item.entity';
import { Product } from 'src/entities/product.entity';
import { CartService } from './cart.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, Product]), AuthModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
