"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { NavbarContent } from "./NavbarContent";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [intersecting, setIntersecting] = useState(true);
  const visible = !isHome || !intersecting;

  useEffect(() => {
    if (!isHome) return;

    const sentinel = document.getElementById("hero-nav-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      setIntersecting(true);
    };
  }, [isHome]);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        "transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {/* Equal outer columns keep the search box centred in the header. */}
      <div className="container mx-auto grid h-14 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center xl:grid-cols-[1fr_minmax(0,36rem)_1fr] gap-4 px-4">
        <Link
          href="/"
          className="justify-self-start whitespace-nowrap text-lg font-bold tracking-tight"
        >
          E-com
        </Link>
        <NavbarContent />
      </div>
    </header>
  );
}
