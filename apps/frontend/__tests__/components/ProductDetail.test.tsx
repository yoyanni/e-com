import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductDetail from "@/app/products/[slug]/ProductDetail";
import { renderWithQuery, mockProduct } from "../test-utils";

// Mocks
const addMutateMock = jest.fn();

jest.mock("@/hooks/useCart", () => ({
  useCart: jest.fn(),
}));

import { useCart } from "@/hooks/useCart";
const mockUseCart = useCart as jest.Mock;

// Per-test setup
function makeCartHook(
  overrides: Partial<ReturnType<typeof useCart>["addMutation"]> = {},
) {
  return {
    addMutation: {
      mutate: addMutateMock,
      isPending: false,
      ...overrides,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCart.mockReturnValue(makeCartHook());
});

// Tests
describe("ProductDetail", () => {
  describe("product info", () => {
    it("renders the product name", () => {
      renderWithQuery(<ProductDetail product={mockProduct()} />);

      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });

    it("renders the formatted price", () => {
      renderWithQuery(
        <ProductDetail product={mockProduct({ price: 49.99 })} />,
      );

      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });

    it("renders description when present", () => {
      renderWithQuery(
        <ProductDetail
          product={mockProduct({ description: "Great product" })}
        />,
      );

      expect(screen.getByText("Great product")).toBeInTheDocument();
    });

    it("renders no description paragraph when description is null", () => {
      renderWithQuery(
        <ProductDetail product={mockProduct({ description: null })} />,
      );

      expect(screen.queryByText("Great product")).toBeNull();
    });
  });

  describe("StockBadge", () => {
    it("shows 'Out of stock' when stock is 0", () => {
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 0 })} />);

      const [badge] = screen.getAllByText("Out of stock");
      expect(badge).toBeInTheDocument();
    });

    it("shows 'Low stock (3 left)' when stock is 3", () => {
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 3 })} />);

      expect(screen.getByText("Low stock (3 left)")).toBeInTheDocument();
    });

    it("shows 'In stock' when stock is above 5", () => {
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 10 })} />);

      expect(screen.getByText("In stock")).toBeInTheDocument();
    });
  });

  describe("quantity stepper", () => {
    it("starts at quantity 1", () => {
      renderWithQuery(<ProductDetail product={mockProduct()} />);

      // The quantity span sits between the two stepper buttons
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("disables '−' when quantity is 1", () => {
      renderWithQuery(<ProductDetail product={mockProduct()} />);

      expect(
        screen.getByRole("button", { name: /decrease quantity/i }),
      ).toBeDisabled();
    });

    it("increments quantity when '+' is clicked", async () => {
      const user = userEvent.setup();
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 10 })} />);

      await user.click(
        screen.getByRole("button", { name: /increase quantity/i }),
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("disables '+' when quantity reaches stock", async () => {
      const user = userEvent.setup();
      // stock: 2 — can only go up to 2
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 2 })} />);

      await user.click(
        screen.getByRole("button", { name: /increase quantity/i }),
      );

      expect(
        screen.getByRole("button", { name: /increase quantity/i }),
      ).toBeDisabled();
    });
  });

  describe("Add to cart button", () => {
    it("calls addMutation.mutate with productId and current quantity", async () => {
      const user = userEvent.setup();
      const product = mockProduct({ stock: 10 });
      renderWithQuery(<ProductDetail product={product} />);

      // Increment to 2 then add
      await user.click(
        screen.getByRole("button", { name: /increase quantity/i }),
      );
      await user.click(screen.getByRole("button", { name: /add to cart/i }));

      expect(addMutateMock).toHaveBeenCalledWith({
        productId: product.id,
        quantity: 2,
      });
    });

    it("is disabled and shows 'Out of stock' when stock is 0", () => {
      renderWithQuery(<ProductDetail product={mockProduct({ stock: 0 })} />);

      const button = screen.getByRole("button", { name: /out of stock/i });
      expect(button).toBeDisabled();
    });

    it("is disabled and shows 'Adding…' while mutation is pending", () => {
      mockUseCart.mockReturnValue(makeCartHook({ isPending: true }));

      renderWithQuery(<ProductDetail product={mockProduct()} />);

      const button = screen.getByRole("button", { name: /adding/i });
      expect(button).toBeDisabled();
    });
  });
});
