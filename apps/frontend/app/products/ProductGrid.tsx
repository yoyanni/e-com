import { fetchProducts } from "@/api/server";
import ProductCard from "./ProductCard";
import Pagination from "./Pagination";
import { IProductsQuery } from "@e-com/shared";

interface ProductGridProps {
  searchParams: IProductsQuery;
}

const ProductGrid = async ({ searchParams }: ProductGridProps) => {
  const { data, total, page, limit } = await fetchProducts(searchParams);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination total={total} page={page} limit={limit} />
    </div>
  );
}

export default ProductGrid;
