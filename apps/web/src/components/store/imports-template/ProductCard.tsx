"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartIconButton } from "@/components/store/imports-template/AddToCartButton";
import { formatCedis } from "@/lib/price";
import type { Product } from "@glamsite/shared/types";

function salePercent(priceCedis: number, compareAtPriceCedis?: number): number | null {
  if (compareAtPriceCedis == null || compareAtPriceCedis <= priceCedis) return null;
  return Math.round(((compareAtPriceCedis - priceCedis) / compareAtPriceCedis) * 100);
}

function hasOptions(product: Product): boolean {
  return Boolean((product.sizes?.length ?? 0) > 0 || (product.colors?.length ?? 0) > 0);
}

export function ProductCard({
  product,
  productBase,
}: {
  product: Product;
  productBase: string;
}) {
  const href = `${productBase}/product/${product.id}`;
  const photo = product.images[0] ?? "";
  const discount = salePercent(product.priceCedis, product.compareAtPriceCedis);
  const showCompare =
    product.compareAtPriceCedis != null && product.compareAtPriceCedis > product.priceCedis;

  return (
    <article className="group h-full rounded-lg border border-[#e4e8ef] bg-white transition-colors hover:border-[#1266b5]/40">
      <div className="relative p-3 pb-0 sm:p-4 sm:pb-0">
        <Link
          href={href}
          className="relative block aspect-square overflow-hidden rounded-lg bg-[#e8f1fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]"
        >
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-3 text-center text-sm text-[#66707e]">
              {product.name}
            </span>
          )}
          {discount !== null ? (
            <span className="absolute top-2 left-2 rounded-md bg-[#c2410c] px-2 py-0.5 text-xs font-semibold text-white">
              -{discount}%
            </span>
          ) : null}
        </Link>
        {hasOptions(product) ? null : (
          <AddToCartIconButton
            productId={product.id}
            name={product.name}
            priceCedis={product.priceCedis}
            image={photo}
          />
        )}
      </div>
      <Link
        href={href}
        className="flex flex-col rounded-b-lg p-3 pt-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5] sm:p-4 sm:pt-3"
      >
        {product.category ? (
          <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[#66707e] uppercase">
            {product.category}
          </p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 font-medium text-[#1a1f2b]">{product.name}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="font-bold text-[#1266b5]">{formatCedis(product.priceCedis)}</p>
          {showCompare ? (
            <p className="text-sm text-[#66707e] line-through">
              {formatCedis(product.compareAtPriceCedis!)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  products,
  productBase,
  emptyTitle = "No products to show",
  emptyDescription = "Nothing matches this view yet. Try another category or check back soon.",
}: {
  products: Product[];
  productBase: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#e4e8ef] bg-white px-6 py-16 text-center">
        <p className="font-medium text-[#1a1f2b]">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#66707e]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} productBase={productBase} />
        </li>
      ))}
    </ul>
  );
}
