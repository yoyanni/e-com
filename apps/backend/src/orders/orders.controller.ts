import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req: { user: { id: string } }) {
    return this.ordersService.checkout(req.user.id);
  }

  @Get()
  findAll(@Req() req: { user: { id: string } }) {
    return this.ordersService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.id, id);
  }
}
