import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import { createQueryClient, createWrapper, mockUser } from "../test-utils";
import type { QueryClient } from "@tanstack/react-query";
import type { ILoginDto, IRegisterDto } from "@e-com/shared";

// Mocks
const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

jest.mock("@/api/service", () => ({
  fetchMe: jest.fn(),
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
  fetchCart: jest.fn(),
}));

import * as service from "@/api/service";
const mockFetchMe = jest.mocked(service.fetchMe);
// The below functions return AxiosResponse objects that we dont care about
const mockLoginUser = service.loginUser as jest.Mock;
const mockRegisterUser = service.registerUser as jest.Mock;
const mockLogoutUser = service.logoutUser as jest.Mock;

// Per-test setup
let queryClient: QueryClient;

function renderUseAuth() {
  return renderHook(() => useAuth(), { wrapper: createWrapper(queryClient) });
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = createQueryClient();
});

// Tests
describe("useAuth", () => {
  describe("initial state", () => {
    it("is unauthenticated when fetchMe resolves null", async () => {
      mockFetchMe.mockResolvedValue(null);

      const { result } = renderUseAuth();

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("is loading while fetchMe is pending", () => {
      mockFetchMe.mockReturnValue(new Promise(() => {}));

      const { result } = renderUseAuth();

      expect(result.current.isLoading).toBe(true);
    });

    it("is authenticated when fetchMe resolves a user", async () => {
      const user = mockUser();
      mockFetchMe.mockResolvedValue(user);

      const { result } = renderUseAuth();

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
      expect(result.current.user).toEqual(user);
    });
  });

  describe("loginMutation", () => {
    it("calls loginUser with the provided credentials", async () => {
      mockFetchMe.mockResolvedValue(null);
      mockLoginUser.mockResolvedValue({});

      const credentials: ILoginDto = {
        email: "test@example.com",
        password: "password",
      };

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.loginMutation.mutateAsync(credentials);

      expect(mockLoginUser).toHaveBeenCalledWith(credentials);
    });

    it("calls router.refresh() on success", async () => {
      mockFetchMe.mockResolvedValue(null);
      mockLoginUser.mockResolvedValue({});

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.loginMutation.mutateAsync({
        email: "a@b.com",
        password: "pw",
      });

      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    it("does not redirect or change auth state on failure", async () => {
      mockFetchMe.mockResolvedValue(null);
      mockLoginUser.mockRejectedValue(new Error("Invalid credentials"));

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.loginMutation.mutateAsync({
          email: "a@b.com",
          password: "wrong",
        }),
      ).rejects.toThrow();

      expect(refreshMock).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("registerMutation", () => {
    it("calls registerUser with payload and redirects to /products", async () => {
      mockFetchMe.mockResolvedValue(null);
      mockRegisterUser.mockResolvedValue({});

      const payload: IRegisterDto = {
        name: "Alice",
        email: "alice@example.com",
        password: "password",
      };

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.registerMutation.mutateAsync(payload);

      expect(mockRegisterUser).toHaveBeenCalledWith(payload);
      expect(pushMock).toHaveBeenCalledWith("/products");
    });
  });

  describe("logoutMutation", () => {
    it("clears me and cart cache then redirects to /", async () => {
      mockFetchMe.mockResolvedValue(mockUser());
      mockLogoutUser.mockResolvedValue({});

      // Pre-seed the cart so we can assert it gets wiped
      queryClient.setQueryData(["cart"], [{ id: "item-1" }]);

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await result.current.logoutMutation.mutateAsync();

      expect(queryClient.getQueryData(["me"])).toBeNull();
      expect(queryClient.getQueryData(["cart"])).toEqual([]);
      expect(pushMock).toHaveBeenCalledWith("/");
    });

    it("calls logoutUser once", async () => {
      mockFetchMe.mockResolvedValue(mockUser());
      mockLogoutUser.mockResolvedValue({});

      const { result } = renderUseAuth();
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await result.current.logoutMutation.mutateAsync();

      expect(mockLogoutUser).toHaveBeenCalledTimes(1);
    });
  });
});
