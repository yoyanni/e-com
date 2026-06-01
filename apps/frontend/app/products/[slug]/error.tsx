"use client";

export default function ProductError() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium">Could not load product</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This product is temporarily unavailable.
      </p>
    </div>
  );
}
