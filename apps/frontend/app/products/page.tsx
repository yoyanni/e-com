import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchCategories } from "@/api/server";
import FilterSidebar from "./FilterSidebar";
import ProductGrid from "./ProductGrid";
import ProductGridSkeleton from "./ProductGridSkeleton";
import { IProductsQuery } from "@e-com/shared";

interface ProductsPageProps {
  searchParams: Promise<IProductsQuery>;
}

export const generateMetadata = async ({
  searchParams,
}: ProductsPageProps): Promise<Metadata> => {
  const { search } = await searchParams;
  return {
    title: search ? `Search: ${search} | E-com` : "Products | E-com",
    description: "Browse our full product catalog.",
  };
}

const ProductsPage = async ({
  searchParams,
}: ProductsPageProps) => {
  const params = await searchParams;
  const categories = await fetchCategories();

  return (
    <div className="mt-4 mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-bold">
        {params.search ? `Results for "${params.search}"` : "All Products"}
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSidebar categories={categories} />
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}

export default ProductsPage;