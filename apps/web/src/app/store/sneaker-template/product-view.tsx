import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/sneaker-template/ProductDetail";
import { getSneakerProductPage, listSneakerProducts } from "@/components/store/sneaker-template/catalog";
import { formatCedis } from "@/lib/price";
import { pickRelatedCatalogProducts } from "@/lib/related-products";
import { storefrontBase } from "@/lib/store-path";

export async function SneakerProductView({
  productId,
  storeSlug,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [page, catalog] = await Promise.all([
    getSneakerProductPage(productId, storeSlug),
    listSneakerProducts(storeSlug),
  ]);
  if (!page) notFound();
  const related = pickRelatedCatalogProducts(page.product, catalog, 4);
  const productBase = storefrontBase("sneaker-template", storeSlug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <ProductDetail product={page.product} faqs={page.faqs}>
        {related.length > 0 ? (
          <section className="mt-12 border-t border-[#3C2415]/15 pt-10">
            <h2
              className="text-[26px] font-semibold text-[#2A1C14]"
              style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
            >
              Related products
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((product) => {
                const photo = product.images[0];
                return (
                  <Link key={product.id} href={`${productBase}/product/${product.id}`} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#E8E2D9]">
                      {photo ? (
                        <Image src={photo} alt={product.name} fill sizes="20vw" className="object-cover" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-tight">{product.name}</p>
                    <p className="mt-1 text-sm font-bold">{formatCedis(product.priceCedis)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </ProductDetail>
    </div>
  );
}
