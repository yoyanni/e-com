"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ICategory } from "@e-com/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

interface FilterSidebarProps {
  categories: ICategory[];
}

const FilterSidebar = ({ categories }: FilterSidebarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const handleUpdate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.replace(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    const search = searchParams.get("search");
    router.replace(
      search ? `/products?search=${encodeURIComponent(search)}` : "/products",
    );
  };

  return (
    <aside className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Category</p>
        <select
          className={selectClass}
          value={searchParams.get("category") ?? ""}
          onChange={(e) => handleUpdate("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Price range</p>
        <div className="flex items-center gap-2">
          <Input
            key={`min-${minPrice}`}
            type="number"
            min={0}
            placeholder="Min"
            className="h-8"
            defaultValue={minPrice}
            onBlur={(e) => handleUpdate("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            key={`max-${maxPrice}`}
            type="number"
            min={0}
            placeholder="Max"
            className="h-8"
            defaultValue={maxPrice}
            onBlur={(e) => handleUpdate("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Sort</p>
        <select
          className={selectClass}
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => handleUpdate("sort", e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleClearFilters}
      >
        Clear filters
      </Button>
    </aside>
  );
};

export default FilterSidebar;
