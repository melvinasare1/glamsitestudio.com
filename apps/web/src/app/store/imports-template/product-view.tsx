import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/imports-template/ProductDetail";
import { getImportsProductPage, listImportsProducts } from "@/components/store/imports-template/catalog";
import { formatCedis } from "@/lib/price";
import { pickRelatedCatalogProducts } from "@/lib/related-products";
import { storefrontBase } from "@/lib/store-path";

export async function ImportsProductView({
  productId,
  storeSlug,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [page, catalog] = await Promise.all([
    getImportsProductPage(productId, storeSlug),
    listImportsProducts(storeSlug),
  ]);
  if (!page) notFound();
  const related = pickRelatedCatalogProducts(page.product, catalog, 4);
  const productBase = storefrontBase("imports-template", storeSlug);

  return (
    <ProductDetail product={page.product} faqs={page.faqs}>
      {related.length > 0 ? (
        <section className="mt-16 border-t border-[#e4e8ef] pt-12">
          <h2 className="text-xl font-semibold tracking-tight text-[#1a1f2b]">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((product) => {
              const photo = product.images[0];
              return (
                <Link key={product.id} href={`${productBase}/product/${product.id}`} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[#e8f1fa]">
                    {photo ? (
                      <Image src={photo} alt={product.name} fill sizes="25vw" className="object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-[15px] font-medium leading-snug text-[#1a1f2b]">{product.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#1266b5]">{formatCedis(product.priceCedis)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </ProductDetail>
  );
}
