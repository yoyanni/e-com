import { Product } from 'src/entities/product.entity';
import { ProductsService } from './products.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

function makeProductRepo() {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const repo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOne: jest.fn(),
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
  };

  return { repo, qb };
}

const mockProducts = [
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Over-ear noise cancelling headphones with 30hr battery life.',
    price: 79.99,
    stock: 42,
    imageUrl: 'https://placehold.co/400x400?text=Headphones',
    category: {
      id: 'cat-0001',
      name: 'Electronics',
      slug: 'electronics',
      products: [],
    },
    categoryId: 'cat-0001',
    cartItems: [],
    orderItems: [],
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    name: 'Running Shoes',
    slug: 'running-shoes',
    description: 'Lightweight trainers with responsive foam cushioning.',
    price: 119.95,
    stock: 15,
    imageUrl: 'https://placehold.co/400x400?text=Shoes',
    category: {
      id: 'cat-0002',
      name: 'Footwear',
      slug: 'footwear',
      products: [],
    },
    categoryId: 'cat-0002',
    cartItems: [],
    orderItems: [],
    createdAt: new Date('2025-02-05T08:30:00Z'),
    updatedAt: new Date('2025-03-01T12:00:00Z'),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000003',
    name: 'Desk Lamp',
    slug: 'desk-lamp',
    description: null,
    price: 34.5,
    stock: 0,
    imageUrl: null,
    category: null,
    categoryId: null,
    cartItems: [],
    orderItems: [],
    createdAt: new Date('2025-03-20T14:00:00Z'),
    updatedAt: new Date('2025-03-20T14:00:00Z'),
  },
] satisfies Partial<Product>[];

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: ReturnType<typeof makeProductRepo>;

  beforeEach(() => {
    jest.clearAllMocks();
    productRepo = makeProductRepo();

    service = new ProductsService(productRepo.repo as any);
  });

  describe('findAll', () => {
    let qb: ReturnType<typeof makeProductRepo>['qb'];

    beforeEach(() => {
      ({ qb } = productRepo);
      qb.getManyAndCount.mockResolvedValue([[], 0]);
    });

    describe('pagination', () => {
      it('returns correct data shape with meta', async () => {
        qb.getManyAndCount.mockResolvedValue([
          mockProducts,
          mockProducts.length,
        ]);

        const result = await service.findAll({});

        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: mockProducts,
          total: mockProducts.length,
          page: 1,
          limit: 24,
        });
      });

      it('calculates correct skip based on page and limit', async () => {
        await service.findAll({ page: 3, limit: 10 });

        expect(qb.skip).toHaveBeenCalledWith(20);
        expect(qb.take).toHaveBeenCalledWith(10);
      });
    });

    describe('filtering', () => {
      beforeEach(() => {
        qb.getManyAndCount.mockResolvedValue([[mockProducts[0]], 1]);
      });

      it('applies search filter', async () => {
        const result = await service.findAll({ search: 'Wireless' });

        expect(qb.andWhere).toHaveBeenCalledWith(
          '(product.name ILIKE :search OR product.description ILIKE :search)',
          { search: '%Wireless%' },
        );
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: [mockProducts[0]],
          total: 1,
          page: 1,
          limit: 24,
        });
      });

      it('applies category filter', async () => {
        const result = await service.findAll({ category: 'electronics' });

        expect(qb.andWhere).toHaveBeenCalledWith('category.slug = :category', {
          category: 'electronics',
        });
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: [mockProducts[0]],
          total: 1,
          page: 1,
          limit: 24,
        });
      });

      it('applies minPrice filter', async () => {
        const result = await service.findAll({ minPrice: 50 });

        expect(qb.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', {
          minPrice: 50,
        });
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: [mockProducts[0]],
          total: 1,
          page: 1,
          limit: 24,
        });
      });

      it('applies maxPrice filter', async () => {
        const result = await service.findAll({ maxPrice: 100 });
        expect(qb.andWhere).toHaveBeenCalledWith('product.price <= :maxPrice', {
          maxPrice: 100,
        });
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: [mockProducts[0]],
          total: 1,
          page: 1,
          limit: 24,
        });
      });

      it('applies all filters simultaneously', async () => {
        const result = await service.findAll({
          search: 'Headphones',
          category: 'electronics',
          minPrice: 50,
          maxPrice: 100,
        });

        expect(qb.andWhere).toHaveBeenCalledTimes(4);
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: [mockProducts[0]],
          total: 1,
          page: 1,
          limit: 24,
        });
      });

      it('returns unfiltered results when no filters provided', async () => {
        qb.getManyAndCount.mockResolvedValue([
          mockProducts,
          mockProducts.length,
        ]);

        const result = await service.findAll({});

        expect(qb.andWhere).not.toHaveBeenCalled();
        expect(qb.getManyAndCount).toHaveBeenCalled();
        expect(result).toEqual({
          data: mockProducts,
          total: mockProducts.length,
          page: 1,
          limit: 24,
        });
      });
    });

    describe('sorting', () => {
      it('defaults to createdAt DESC when no sort param provided', async () => {
        await service.findAll({});

        expect(qb.orderBy).toHaveBeenCalledWith('product.createdAt', 'DESC');
      });

      it('sorts by price ASC when sort=price_asc', async () => {
        await service.findAll({ sort: 'price_asc' });

        expect(qb.orderBy).toHaveBeenCalledWith('product.price', 'ASC');
      });
    });
  });

  describe('findOneBySlug', () => {
    it('returns product when found', async () => {
      productRepo.repo.findOne.mockResolvedValue(mockProducts[0]);

      const result = await service.findOneBySlug('wireless-headphones');
      expect(productRepo.repo.findOne).toHaveBeenCalledWith({
        where: { slug: 'wireless-headphones' },
        relations: ['category'],
      });
      expect(result).toEqual(mockProducts[0]);
    });

    it('returns product with null category', async () => {
      productRepo.repo.findOne.mockResolvedValue(mockProducts[2]);

      const result = await service.findOneBySlug('desk-lamp');
      expect(productRepo.repo.findOne).toHaveBeenCalledWith({
        where: { slug: 'desk-lamp' },
        relations: ['category'],
      });
      expect(result).toEqual(mockProducts[2]);
    });

    it('throws NotFoundException when product does not exist', async () => {
      productRepo.repo.findOne.mockResolvedValue(null);

      await expect(service.findOneBySlug('non-existent-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneBySlug('non-existent-slug')).rejects.toThrow(
        'Product with slug "non-existent-slug" not found',
      );
    });
  });

  describe('create', () => {
    const dto = { name: 'Wireless Headphones', price: 79.99, stock: 42 };

    it('creates product with slugified name when no collision', async () => {
      productRepo.repo.existsBy.mockResolvedValue(false);
      productRepo.repo.create.mockReturnValue(mockProducts[0]);
      productRepo.repo.save.mockResolvedValue(mockProducts[0]);

      const result = await service.create(dto);

      expect(productRepo.repo.create).toHaveBeenCalledWith({
        ...dto,
        slug: 'wireless-headphones',
      });
      expect(productRepo.repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockProducts[0]);
    });

    it('appends suffix when slug already exists', async () => {
      productRepo.repo.existsBy
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      productRepo.repo.create.mockReturnValue({
        slug: 'wireless-headphones-1',
      });
      productRepo.repo.save.mockResolvedValue({
        slug: 'wireless-headphones-1',
      });

      await service.create(dto);

      expect(productRepo.repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'wireless-headphones-1' }),
      );
    });

    it('throws InternalServerErrorException when save fails', async () => {
      productRepo.repo.existsBy.mockResolvedValue(false);
      productRepo.repo.create.mockReturnValue(mockProducts[0]);
      productRepo.repo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    const mockProduct = mockProducts[0];
    const id = mockProduct.id;
    const dto = { price: 89.99, stock: 10 };

    it('returns the updated product on success', async () => {
      const updated = { ...mockProduct, ...dto };
      productRepo.repo.preload.mockResolvedValue(updated);
      productRepo.repo.save.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(productRepo.repo.preload).toHaveBeenCalledWith({ id, ...dto });
      expect(productRepo.repo.save).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('merges only provided fields', async () => {
      const partialDto = { stock: 99 };
      const preloaded = { ...mockProduct, stock: 99 };
      productRepo.repo.preload.mockResolvedValue(preloaded);
      productRepo.repo.save.mockResolvedValue(preloaded);

      await service.update(id, partialDto);

      expect(productRepo.repo.preload).toHaveBeenCalledWith({ id, stock: 99 });
    });

    it('throws NotFoundException when product does not exist', async () => {
      productRepo.repo.preload.mockResolvedValue(undefined);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(id, dto)).rejects.toThrow(
        `Product with id "${id}" not found`,
      );
      expect(productRepo.repo.save).not.toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when save fails', async () => {
      productRepo.repo.preload.mockResolvedValue(mockProduct);
      productRepo.repo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.update(id, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
