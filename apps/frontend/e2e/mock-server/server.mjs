import http from "node:http";
import { URL } from "node:url";

const category = {
  id: "cat-1",
  name: "Category",
  slug: "category",
};

const products = [
  {
    id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    description: null,
    price: 49.99,
    stock: 10,
    imageUrl: null,
    category,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const PORT = 3002;

const server = http.createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Content-Type", "application/json");

  // GET /categories
  if (req.method === "GET" && pathname === "/categories") {
    res.end(JSON.stringify([category]));
    return;
  }

  // GET /products/:slug  (must come before /products to match more specific route)
  const slugMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (req.method === "GET" && slugMatch) {
    const slug = decodeURIComponent(slugMatch[1]);
    const product = products.find((p) => p.slug === slug);
    if (product) {
      res.end(JSON.stringify(product));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ statusCode: 404, message: `Product not found: ${slug}` }));
    }
    return;
  }

  // GET /products (with optional query params)
  if (req.method === "GET" && pathname === "/products") {
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);
    res.end(
      JSON.stringify({
        data: products,
        total: products.length,
        page,
        limit,
      }),
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ statusCode: 404, message: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`Mock backend running at http://localhost:${PORT}`);
});
