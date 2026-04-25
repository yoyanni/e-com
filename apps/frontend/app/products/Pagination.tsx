"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const PER_PAGE_OPTIONS = ["12", "24", "48"];

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
}

const Pagination = ({ total, page, limit }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  const handleGoToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`/products?${params.toString()}`);
  }

  const handleChangeLimit = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.delete("page");
    router.replace(`/products?${params.toString()}`);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => handleGoToPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => handleGoToPage(page + 1)}
      >
        Next
      </Button>
      <select
        value={String(limit)}
        onChange={(e) => handleChangeLimit(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} / page
          </option>
        ))}
      </select>
    </div>
  );
}

export default Pagination;
