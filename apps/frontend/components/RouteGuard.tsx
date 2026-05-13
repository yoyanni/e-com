"use client";

import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const loginUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (!user) return null;

  return <>{children}</>;
}
