import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/template-a/ProductDetail";
import { ShirtPlaceholder } from "@/components/store/template-a/ShirtPlaceholder";
import { getTemplateAProductPage, listTemplateAProducts } from "@/components/store/template-a/catalog";
import { formatCedis } from "@/lib/price";
import { pickRelatedCatalogProducts } from "@/lib/related-products";
import { storefrontBase } from "@/lib/store-path";
import { fillFromId, swatchHex } from "@/lib/swatch";

export async function TemplateAProductView({
  productId,
  storeSlug,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [page, catalog] = await Promise.all([
    getTemplateAProductPage(productId, storeSlug),
    listTemplateAProducts(storeSlug),
  ]);
  if (!page) notFound();
  const related = pickRelatedCatalogProducts(page.product, catalog, 4);
  const productBase = storefrontBase("template-a", storeSlug);

  return (
    <ProductDetail product={page.product} faqs={page.faqs}>
      {related.length > 0 ? (
        <section className="mt-16 border-t border-black/8 pt-12">
          <h2 className="text-[32px] font-extrabold tracking-tight text-black md:text-[36px]">
            Related products
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {related.map((product) => {
              const photo = product.images[0];
              const swatch = product.colors?.[0] ? swatchHex(product.colors[0]) : fillFromId(product.id);
              return (
                <article key={product.id}>
                  <Link
                    href={`${productBase}/product/${product.id}`}
                    className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-[#EDEDED]"
                  >
                    {photo ? (
                      <Image src={photo} alt={product.name} fill sizes="25vw" className="object-cover" />
                    ) : (
                      <ShirtPlaceholder fill={swatch} className="h-[72%] w-[72%]" />
                    )}
                  </Link>
                  <Link href={`${productBase}/product/${product.id}`} className="mt-3 block">
                    <p className="text-[15px] font-bold leading-snug">{product.name}</p>
                    <p className="mt-1 text-[14px] text-black/80">{formatCedis(product.priceCedis)}</p>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </ProductDetail>
  );
}
