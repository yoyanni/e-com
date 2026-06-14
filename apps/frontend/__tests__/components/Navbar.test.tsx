import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/Navbar";
import { renderWithQuery, mockCartItem } from "../test-utils";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/products",
}));

const logoutMutateMock = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/useCart", () => ({
  useCart: jest.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
const mockUseAuth = useAuth as jest.Mock;
const mockUseCart = useCart as jest.Mock;

// Per-test setup
beforeEach(() => {
  jest.clearAllMocks();
  // Safe defaults — override per test as needed
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    logoutMutation: { mutate: logoutMutateMock, isPending: false },
  });
  mockUseCart.mockReturnValue({ cartItems: [] });
});

// Tests
describe("Navbar", () => {
  describe("cart badge", () => {
    it("does not show a badge when the cart is empty", () => {
      mockUseCart.mockReturnValue({ cartItems: [] });

      renderWithQuery(<Navbar />);

      expect(screen.queryByLabelText(/items in cart/i)).toBeNull();
    });

    it("shows the summed quantity across all cart items", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        logoutMutation: { mutate: logoutMutateMock, isPending: false },
      });
      mockUseCart.mockReturnValue({
        cartItems: [
          mockCartItem({ quantity: 3 }),
          mockCartItem({ id: "item-2", quantity: 2 }),
        ],
      });

      renderWithQuery(<Navbar />);

      // quantity sum: 3 + 2 = 5
      expect(
        await screen.findByLabelText("5 items in cart"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("5 items in cart")).toHaveTextContent("5");
    });

    it("caps the badge at 99+", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        logoutMutation: { mutate: logoutMutateMock, isPending: false },
      });
      mockUseCart.mockReturnValue({
        cartItems: [mockCartItem({ quantity: 100 })],
      });

      renderWithQuery(<Navbar />);

      expect(
        await screen.findByLabelText("100 items in cart"),
      ).toHaveTextContent("99+");
    });
  });

  describe("guest state (isAuthenticated = false)", () => {
    it("shows Login and Register links", () => {
      renderWithQuery(<Navbar />);

      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /register/i }),
      ).toBeInTheDocument();
    });

    it("does not show Account or Logout", () => {
      renderWithQuery(<Navbar />);

      expect(screen.queryByRole("link", { name: /account/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /logout/i })).toBeNull();
    });
  });

  describe("authenticated state (isAuthenticated = true)", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        logoutMutation: { mutate: logoutMutateMock, isPending: false },
      });
    });

    it("shows Account and Logout", () => {
      renderWithQuery(<Navbar />);

      expect(
        screen.getByRole("link", { name: /account/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /logout/i }),
      ).toBeInTheDocument();
    });

    it("does not show Login or Register", () => {
      renderWithQuery(<Navbar />);

      expect(screen.queryByRole("link", { name: /login/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /register/i })).toBeNull();
    });

    it("calls logoutMutation.mutate when Logout is clicked", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Navbar />);

      await user.click(screen.getByRole("button", { name: /logout/i }));

      expect(logoutMutateMock).toHaveBeenCalledTimes(1);
    });
  });
});
