import "server-only";
import { ICategory, IPaginatedProducts, IProductsQuery } from "@e-com/shared";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function fetchProducts(
  params: IProductsQuery,
): Promise<IPaginatedProducts> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category) qs.set("category", params.category);
  if (params.minPrice) qs.set("minPrice", params.minPrice);
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", params.page);
  if (params.limit) qs.set("limit", params.limit);

  const res = await fetch(`${BACKEND_URL}/products?${qs.toString()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchCategories(): Promise<ICategory[]> {
  const res = await fetch(`${BACKEND_URL}/categories`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}
