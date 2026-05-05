import { IAddCartItemDto } from '@e-com/shared';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto implements IAddCartItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
