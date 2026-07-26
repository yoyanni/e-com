"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IProduct } from "@e-com/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface ProductDetailProps {
  product: IProduct;
}

const StockBadge = ({ stock }: { stock: number }) => {
  if (stock === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= 5)
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-400">
        Low stock ({stock} left)
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-green-600 border-green-400">
      In stock
    </Badge>
  );
};

const ProductDetail = ({ product }: ProductDetailProps) => {
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(product.stock, 99);
  const { addMutation } = useCart();

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(product.price));

  const handleAddToCart = () => {
    addMutation.mutate({ productId: product.id, quantity });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-accent">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-accent-foreground/70">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-4">
        {product.category && (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="w-fit"
          >
            <Badge variant="secondary">{product.category.name}</Badge>
          </Link>
        )}

        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl font-semibold">{price}</p>

        <StockBadge stock={product.stock} />

        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Quantity stepper + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <span className="w-10 text-center text-sm font-medium">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>

          <Button
            className="flex-1"
            disabled={product.stock === 0 || addMutation.isPending}
            onClick={handleAddToCart}
          >
            {product.stock === 0
              ? "Out of stock"
              : addMutation.isPending
                ? "Adding…"
                : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
