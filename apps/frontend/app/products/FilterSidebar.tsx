"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ICategory } from "@e-com/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// Radix Select doesn't allow "" as an item value, so "no category filter"
// needs a stand-in. The underscore keeps it from clashing with a real slug.
const ALL_CATEGORIES = "_all";

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
        <Select
          value={searchParams.get("category") ?? ALL_CATEGORIES}
          onValueChange={(value) =>
            handleUpdate("category", value === ALL_CATEGORIES ? "" : value)
          }
        >
          <SelectTrigger className="w-full" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(value) => handleUpdate("sort", value)}
        >
          <SelectTrigger className="w-full" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
