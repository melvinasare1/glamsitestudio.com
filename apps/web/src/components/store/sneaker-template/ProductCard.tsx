import Image from "next/image";
import Link from "next/link";
import { ProductCardActions } from "@/components/store/sneaker-template/AddToCartButton";
import { formatCedis } from "@/lib/price";
import { fillFromId, swatchHex } from "@/lib/swatch";
import type { Product } from "@glamsite/shared/types";

function cardImage(product: Product): string {
  const photo = product.images[0];
  if (photo) return photo;
  const firstColor = product.colors?.[0];
  if (firstColor) return swatchHex(firstColor);
  return fillFromId(product.id);
}

export function SneakerProductCard({
  product,
  base,
}: {
  product: Product;
  base: string;
}) {
  const photo = product.images[0];
  const image = cardImage(product);
  const blurb = product.shortDescription || product.description;

  return (
    <article className="flex h-full flex-col rounded-[24px] bg-[#EDE6DC] p-4 sm:p-5">
      <Link href={`${base}/product/${product.id}`} className="block min-w-0">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white"
          style={photo ? undefined : { backgroundColor: image }}
        >
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-contain p-6"
            />
          ) : null}
          <span className="absolute right-3 top-3 rounded-full bg-[#EDE6DC] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A1C14]">
            New arrival
          </span>
        </div>
        <p className="mt-4 text-[17px] font-bold text-[#2A1C14]">{formatCedis(product.priceCedis)}</p>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#2A1C14]">{product.name}</h3>
        {blurb ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#2A1C14]/55">{blurb}</p>
        ) : null}
      </Link>
      <div className="mt-auto">
        <ProductCardActions
          productId={product.id}
          name={product.name}
          priceCedis={product.priceCedis}
          image={image}
          cartHref={`${base}/cart`}
        />
      </div>
    </article>
  );
}
