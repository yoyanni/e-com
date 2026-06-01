"use client";

export default function ProductsError() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium">Could not load products</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The product catalog is temporarily unavailable.
      </p>
    </div>
  );
}
