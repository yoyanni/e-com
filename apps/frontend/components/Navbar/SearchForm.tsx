"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent, useRef } from "react";

import { Input } from "@/components/ui/input";

// Fills the middle column of the Navbar grid, which caps the width.
const FORM_CLASS = "flex items-center";
// Solid background: the header is translucent, so page content scrolling
// underneath showed through the input and made it hard to read.
const INPUT_CLASS = "h-8 bg-background dark:bg-background";

// The only part of the navbar that reads useSearchParams. On prerendered pages
// that hook makes everything up to the nearest <Suspense> render on the client
// only, so keeping it in here lets the rest of the navbar ship in the HTML.
export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = inputRef.current?.value.trim() ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page"); // reset pagination on new search
    router.push(`/products?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className={FORM_CLASS}>
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search products…"
        defaultValue={searchParams.get("search") ?? ""}
        className={INPUT_CLASS}
        aria-label="Search products"
      />
    </form>
  );
}

// Same size and look as SearchForm, shown in the prerendered HTML until the
// real form hydrates. Read-only so nothing typed before then gets thrown away.
export function SearchFormFallback() {
  return (
    <div className={FORM_CLASS} aria-hidden>
      <Input
        type="search"
        placeholder="Search products…"
        className={INPUT_CLASS}
        readOnly
        tabIndex={-1}
      />
    </div>
  );
}
