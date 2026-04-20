// apps/frontend/lib/auth/useAuth.ts
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, loginUser, logoutUser, registerUser } from "@/api/service";

// Centralise the key so invalidations/setQueryData calls elsewhere
// in the codebase (e.g. middleware, other hooks) never drift from the truth.
export const ME_QUERY_KEY = ["me"] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    retry: false, // don't retry 401s — that's not a transient error
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      router.push("/products");
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      router.push("/products");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Set null immediately
      queryClient.setQueryData(ME_QUERY_KEY, null);
      // Clear everything else (cart, orders) so no user-specific data leaks.
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}
