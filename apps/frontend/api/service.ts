import { IRegisterDto } from "@e-com/shared";
import apiClient from "./client";

export const registerUser = (dto: IRegisterDto) =>
  apiClient.post("/auth/register", dto);