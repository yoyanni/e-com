import { IProductsQuery } from '@e-com/shared';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetProductsQueryDto implements Partial<
  Record<keyof IProductsQuery, string | number>
> {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'newest', 'oldest'])
  sort?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 24;
}
