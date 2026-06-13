import Link from "next/link";
import { Button } from "@/components/ui/button";

const trustItems = [
  { icon: "🚚", title: "Free Shipping", description: "On orders over $50" },
  { icon: "↩️", title: "Easy Returns", description: "30-day return policy" },
  {
    icon: "🔒",
    title: "Secure Checkout",
    description: "SSL encrypted payments",
  },
  {
    icon: "💬",
    title: "24/7 Support",
    description: "We're always here to help",
  },
];

export default function Home() {
  return (
    <div className="-mx-8 -mt-4">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-white px-8 text-center">
        {/* Subtle radial colour blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl"
            style={{ animation: "blob-float 8s ease-in-out infinite" }}
          />
          <div
            className="absolute -top-16 right-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl"
            style={{ animation: "blob-float 10s ease-in-out infinite 2s" }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-rose-100/60 blur-3xl"
            style={{ animation: "blob-float 12s ease-in-out infinite 4s" }}
          />
        </div>
        <div className="z-10 flex flex-col items-center">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400"
            style={{ animation: "fade-up 0.6s ease-out both" }}
          >
            New arrivals every week
          </p>
          <h1
            className="mb-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-900"
            style={{ animation: "fade-up 0.6s ease-out 0.15s both" }}
          >
            Discover Products You&apos;ll Love
          </h1>
          <p
            className="mb-10 max-w-xl text-lg text-slate-500"
            style={{ animation: "fade-up 0.6s ease-out 0.3s both" }}
          >
            Browse our ever-growing catalogue of handpicked items — great
            quality, even better prices.
          </p>
          <div style={{ animation: "fade-up 0.6s ease-out 0.45s both" }}>
            <Button asChild size="lg" className="px-8 py-6 text-base">
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t bg-muted/40 px-8 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="text-3xl">{item.icon}</span>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
