import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCart(@Req() req: { user: { id: string } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  addItem(@Req() req: { user: { id: string } }, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch(':itemId')
  @UseGuards(JwtAuthGuard)
  updateItem(
    @Req() req: { user: { id: string } },
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  @Delete(':itemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteItem(
    @Req() req: { user: { id: string } },
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.deleteItem(req.user.id, itemId);
  }
}
