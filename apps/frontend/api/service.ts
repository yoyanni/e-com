import { ILoginDto, IRegisterDto } from "@e-com/shared";
import apiClient from "./client";

export const registerUser = (dto: IRegisterDto) =>
  apiClient.post("/auth/register", dto);

export const loginUser = (dto: ILoginDto) =>
  apiClient.post("/auth/login", dto);