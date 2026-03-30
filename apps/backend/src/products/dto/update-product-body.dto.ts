import { PartialType } from '@nestjs/mapped-types';
import { CreateProductBodyDto } from './create-product-body.dto';

export class UpdateProductBodyDto extends PartialType(CreateProductBodyDto) {}
