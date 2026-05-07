import {
  ILoginDto,
  IRegisterDto,
  AuthUser,
  ICartItem,
  IOrder,
} from "@e-com/shared";
import apiClient from "./client";

// Auth calls
export const fetchMe = async (): Promise<AuthUser | null> => {
  try {
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  } catch {
    return null;
  }
};

export const registerUser = (dto: IRegisterDto) =>
  apiClient.post("/auth/register", dto);

export const loginUser = (dto: ILoginDto) => apiClient.post("/auth/login", dto);

export const logoutUser = () => apiClient.post("/auth/logout");

// Cart calls
export const fetchCart = async (): Promise<ICartItem[]> => {
  const { data } = await apiClient.get<ICartItem[]>("/cart");
  return data;
};

export const addCartItem = (dto: { productId: string; quantity: number }) =>
  apiClient.post<ICartItem>("/cart", dto);

export const updateCartItem = (itemId: string, quantity: number) =>
  apiClient.patch<ICartItem>(`/cart/${itemId}`, { quantity });

export const removeCartItem = (itemId: string) =>
  apiClient.delete(`/cart/${itemId}`);

// Order call
export const checkoutCart = async (): Promise<IOrder> => {
  const { data } = await apiClient.post<IOrder>("/orders/checkout");
  return data;
};
