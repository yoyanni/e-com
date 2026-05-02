import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { Repository } from 'typeorm';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CreateProductBodyDto } from './dto/create-product-body.dto';
import { slugify } from 'src/utils/slugify';
import { UpdateProductBodyDto } from './dto/update-product-body.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query: GetProductsQueryDto) {
    const { search, category, minPrice, maxPrice, sort, page, limit } = query;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      qb.andWhere('category.slug = :category', { category });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    switch (sort) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'oldest':
        qb.orderBy('product.createdAt', 'ASC');
        break;
      case 'newest':
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }

    const _page = page ?? 1;
    const _limit = limit ?? 24;
    qb.skip((_page - 1) * _limit).take(_limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page: _page, limit: _limit };
  }

  async findOneBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return product;
  }

  async create(data: CreateProductBodyDto) {
    const base = slugify(data.name);
    let slug = base;
    let suffix = 1;

    while (await this.productRepo.existsBy({ slug })) {
      slug = `${base}-${suffix++}`;
    }

    const product = this.productRepo.create({ ...data, slug });
    try {
      return await this.productRepo.save(product);
    } catch {
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async update(id: string, data: UpdateProductBodyDto) {
    const product = await this.productRepo.preload({ id, ...data });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    try {
      return await this.productRepo.save(product);
    } catch {
      throw new InternalServerErrorException('Failed to update product');
    }
  }
}
