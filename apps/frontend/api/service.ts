import { ILoginDto, IRegisterDto, AuthUser } from "@e-com/shared";
import apiClient from "./client";

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

export const loginUser = (dto: ILoginDto) =>
  apiClient.post("/auth/login", dto);

export const logoutUser = () => apiClient.post("/auth/logout");