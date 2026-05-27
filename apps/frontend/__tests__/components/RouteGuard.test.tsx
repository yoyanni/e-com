import { screen, waitFor } from "@testing-library/react";
import { RouteGuard } from "@/components/RouteGuard";
import { renderWithQuery, mockUser } from "../test-utils";

// Mocks
const replaceMock = jest.fn();
let mockPathname = "/protected";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => mockPathname,
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
const mockUseAuth = useAuth as jest.Mock;

// Per-test setup
beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/protected";
  mockUseAuth.mockReturnValue({ user: null, isLoading: false });
});

// Tests
describe("RouteGuard", () => {
  it("renders a spinner while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: true });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    // Loader2 icon renders an svg — confirm children are NOT shown
    expect(screen.queryByText("Protected content")).toBeNull();
    // Confirm the spinner svg is present via its animate-spin class
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders null (no children, no spinner) when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    expect(screen.queryByText("Protected content")).toBeNull();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  it("calls router.replace with encoded redirectTo when unauthenticated", async () => {
    mockPathname = "/cart";
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
    expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcart");
  });

  it("encodes special characters in the redirectTo path", async () => {
    mockPathname = "/account/orders/abc 123";
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
    const url = replaceMock.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent("/account/orders/abc 123"));
  });

  it("renders children when the user is authenticated", () => {
    mockUseAuth.mockReturnValue({ user: mockUser(), isLoading: false });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("does not call router.replace when the user is authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: mockUser(), isLoading: false });

    renderWithQuery(
      <RouteGuard>
        <p>Protected content</p>
      </RouteGuard>,
    );

    // Wait a tick to ensure any pending effects have run
    await waitFor(() =>
      expect(screen.getByText("Protected content")).toBeInTheDocument(),
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
