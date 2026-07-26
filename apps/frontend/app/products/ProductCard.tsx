import Image from "next/image";
import Link from "next/link";
import { IProduct } from "@e-com/shared";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: IProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(product.price));

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <Card className="h-full overflow-hidden pt-0">
        <div className="relative aspect-square overflow-hidden bg-accent">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-accent-foreground/70">
              No image
            </div>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute left-2 top-2">
              Out of stock
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          {product.category && (
            <Badge variant="secondary" className="mb-2 text-xs">
              {product.category.name}
            </Badge>
          )}
          <p className="line-clamp-2 font-medium leading-tight">
            {product.name}
          </p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          <p className="text-lg font-bold">{price}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ProductCard;
