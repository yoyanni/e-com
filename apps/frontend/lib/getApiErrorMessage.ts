// lib/utils.ts (or similar)
import axios from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
