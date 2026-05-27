import { screen } from "@testing-library/react";
import ProductCard from "@/app/products/ProductCard";
import { renderWithQuery, mockProduct, mockCategory } from "../test-utils";

// next/jest automatically stubs next/image and next/link
// no manual mocks needed here.

// Tests
describe("ProductCard", () => {
  it("renders the product name", () => {
    renderWithQuery(<ProductCard product={mockProduct()} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("renders the formatted price", () => {
    renderWithQuery(<ProductCard product={mockProduct({ price: 49.99 })} />);

    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("links to the correct product slug URL", () => {
    renderWithQuery(
      <ProductCard product={mockProduct({ slug: "my-product" })} />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/my-product");
  });

  it("does not show 'Out of stock' badge when stock > 0", () => {
    renderWithQuery(<ProductCard product={mockProduct({ stock: 10 })} />);

    expect(screen.queryByText(/out of stock/i)).toBeNull();
  });

  it("shows 'Out of stock' badge when stock is 0", () => {
    renderWithQuery(<ProductCard product={mockProduct({ stock: 0 })} />);

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it("renders the category badge", () => {
    const product = mockProduct({
      category: mockCategory({ name: "Electronics" }),
    });
    renderWithQuery(<ProductCard product={product} />);

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("does not render a category badge when category is null", () => {
    renderWithQuery(<ProductCard product={mockProduct({ category: null })} />);

    expect(screen.queryByText("Category")).toBeNull();
  });

  it("shows 'No image' placeholder when imageUrl is null", () => {
    renderWithQuery(<ProductCard product={mockProduct({ imageUrl: null })} />);

    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  it("renders an img element when imageUrl is provided", () => {
    renderWithQuery(
      <ProductCard
        product={mockProduct({ imageUrl: "https://example.com/img.jpg" })}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Test Product" }),
    ).toBeInTheDocument();
  });
});
