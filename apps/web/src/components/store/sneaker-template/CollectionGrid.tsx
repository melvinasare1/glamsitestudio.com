import Link from "next/link";
import { SneakerProductCard } from "@/components/store/sneaker-template/ProductCard";
import type { Product } from "@glamsite/shared/types";

export function CollectionGrid({
  heading,
  subheading,
  products,
  base,
  moreHref,
  moreLabel = "See More Collections",
}: {
  heading: string;
  subheading: string;
  products: Product[];
  base: string;
  moreHref: string;
  moreLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          className="text-[32px] font-semibold leading-tight text-[#2A1C14] sm:text-[40px]"
          style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
        >
          {heading}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#2A1C14]/60">{subheading}</p>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[#3C2415]/20 px-6 py-16 text-center">
          <p className="font-semibold text-[#2A1C14]">No products yet</p>
          <p className="mt-2 text-sm text-[#2A1C14]/50">Active products from this shop will show up here.</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <SneakerProductCard key={product.id} product={product} base={base} />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href={moreHref}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#EDE6DC] px-8 text-sm font-semibold text-[#2A1C14] transition hover:bg-white"
        >
          {moreLabel}
        </Link>
      </div>
    </section>
  );
}
