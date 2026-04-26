import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProduct } from "@/api/server";
import ProductDetail from "./ProductDetail";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({
  params,
}: ProductPageProps): Promise<Metadata> => {
  const { slug } = await params;

  try {
    const product = await fetchProduct(slug);
    return {
      title: `${product.name} | E-com`,
      description:
        product.description ?? `Buy ${product.name} at a great price.`,
      openGraph: {
        title: product.name,
        description:
          product.description ?? `Buy ${product.name} at a great price.`,
        ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
      },
    };
  } catch {
    return { title: "Product not found | E-com" };
  }
}

const ProductPage = async ({ params }: ProductPageProps) => {
  const { slug } = await params;

  let product;
  try {
    product = await fetchProduct(slug);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProductDetail product={product} />
    </div>
  );
};

export default ProductPage;
