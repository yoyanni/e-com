import { IUpdateCartItemDto } from '@e-com/shared';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto implements IUpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
