import { Card, CardContent, CardFooter } from "@/components/ui/card";

const ProductGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square animate-pulse bg-muted" />
          <CardContent className="p-4">
            <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
