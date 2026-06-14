"use client";

import Link from "next/link";
import { Suspense } from "react";

import { NavbarContent } from "./NavbarContent";

export function HeroNav() {
  return (
    <div id="hero-nav-sentinel" className="absolute inset-x-0 top-0 z-10">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        <Link
          href="/"
          className="mr-4 shrink-0 text-lg font-bold tracking-tight"
        >
          E-com
        </Link>
        <Suspense>
          <NavbarContent />
        </Suspense>
      </div>
    </div>
  );
}
