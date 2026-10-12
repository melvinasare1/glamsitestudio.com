import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/hair-beauty-template/ProductDetail";
import { getHairProductPage, listHairProducts } from "@/components/store/hair-beauty-template/catalog";
import { formatCedis } from "@/lib/price";
import { pickRelatedCatalogProducts } from "@/lib/related-products";
import { storefrontBase } from "@/lib/store-path";

export async function HairProductView({
  productId,
  storeSlug,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [page, catalog] = await Promise.all([
    getHairProductPage(productId, storeSlug),
    listHairProducts(storeSlug),
  ]);
  if (!page) notFound();
  const related = pickRelatedCatalogProducts(page.product, catalog, 4);
  const productBase = storefrontBase("hair-beauty-template", storeSlug);

  return (
    <ProductDetail product={page.product} faqs={page.faqs}>
      {related.length > 0 ? (
        <section className="mt-16 border-t border-[#d9cfc3] pt-12">
          <h2
            className="text-xl font-medium tracking-tight text-[#4f4a3d]"
            style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
          >
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((product) => {
              const photo = product.images[0];
              return (
                <Link key={product.id} href={`${productBase}/product/${product.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#efe6db]">
                    {photo ? (
                      <Image src={photo} alt={product.name} fill sizes="25vw" className="object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-[15px] font-medium leading-snug text-[#4f4a3d]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#4f4a3d]">
                    {formatCedis(product.priceCedis)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </ProductDetail>
  );
}
