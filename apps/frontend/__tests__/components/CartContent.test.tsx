import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartContent } from "@/app/(protected)/cart/CartContent";
import { renderWithQuery, mockCartItem } from "../test-utils";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const updateMutateMock = jest.fn();
const removeMutateMock = jest.fn();

jest.mock("@/hooks/useCart", () => ({
  useCart: jest.fn(),
}));

import { useCart } from "@/hooks/useCart";
const mockUseCart = useCart as jest.Mock;

// Per-test setup
function makeCartHook(overrides: Partial<ReturnType<typeof useCart>> = {}) {
  return {
    cartItems: [mockCartItem()],
    isLoading: false,
    subtotal: 99.98,
    updateMutation: { mutate: updateMutateMock, isPending: false },
    removeMutation: { mutate: removeMutateMock, isPending: false },
    addMutation: { mutate: jest.fn(), isPending: false },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCart.mockReturnValue(makeCartHook());
});

// Tests
describe("CartContent", () => {
  describe("loading and empty states", () => {
    it("shows loading message while cart is loading", () => {
      mockUseCart.mockReturnValue(
        makeCartHook({ isLoading: true, cartItems: [] }),
      );

      renderWithQuery(<CartContent />);

      expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
    });

    it("shows empty-cart message when there are no items", () => {
      mockUseCart.mockReturnValue(makeCartHook({ cartItems: [], subtotal: 0 }));

      renderWithQuery(<CartContent />);

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe("item display", () => {
    it("renders the product name", () => {
      renderWithQuery(<CartContent />);

      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });

    it("renders the current quantity", () => {
      renderWithQuery(<CartContent />);

      // The quantity span sits between the - and + buttons
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders the formatted subtotal", () => {
      renderWithQuery(<CartContent />);

      // subtotal appears in the sidebar — formatted.format(99.98) = "$99.98"
      expect(screen.getAllByText("$99.98").length).toBeGreaterThan(0);
    });
  });

  describe("quantity controls", () => {
    it("calls updateMutation with qty + 1 when '+' is clicked", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CartContent />);

      await user.click(
        screen.getByRole("button", { name: /increase quantity/i }),
      );

      expect(updateMutateMock).toHaveBeenCalledWith({
        itemId: "item-1",
        quantity: 3, // initial qty 2 + 1
      });
    });

    it("calls updateMutation with qty - 1 when '-' is clicked", async () => {
      const user = userEvent.setup();
      // qty must be > 1 for the button to be enabled
      mockUseCart.mockReturnValue(
        makeCartHook({ cartItems: [mockCartItem({ quantity: 3 })] }),
      );

      renderWithQuery(<CartContent />);

      await user.click(
        screen.getByRole("button", { name: /decrease quantity/i }),
      );

      expect(updateMutateMock).toHaveBeenCalledWith({
        itemId: "item-1",
        quantity: 2, // initial qty 3 - 1
      });
    });

    it("disables '-' when quantity is 1", () => {
      mockUseCart.mockReturnValue(
        makeCartHook({ cartItems: [mockCartItem({ quantity: 1 })] }),
      );

      renderWithQuery(<CartContent />);

      expect(
        screen.getByRole("button", { name: /decrease quantity/i }),
      ).toBeDisabled();
    });
  });

  describe("remove item", () => {
    it("calls removeMutation with the item id when remove is clicked", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CartContent />);

      await user.click(screen.getByRole("button", { name: /remove item/i }));

      expect(removeMutateMock).toHaveBeenCalledWith("item-1");
    });
  });
});
