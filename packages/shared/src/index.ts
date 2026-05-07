// There is a duplicate in apps/backend/src/entities/user.entity.ts
// There was an issue with enums/consts being imported into NestJS
export const UserRole = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto extends ILoginDto {
  name: string;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
}

export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: ICategory | null;
  createdAt: string;
}

export interface IProductsQuery {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export interface IPaginatedProducts {
  data: IProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ICartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: IProduct;
}