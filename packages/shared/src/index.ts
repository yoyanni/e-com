// There is a duplicate in apps/backend/src/entities/user.entity.ts
// There was an issue with enums/consts being imported into NestJS
export const UserRole = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto extends ILoginDto {
  name: string;
}
