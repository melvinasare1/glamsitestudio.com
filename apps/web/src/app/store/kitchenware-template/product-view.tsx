import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/kitchenware-template/ProductDetail";
import { getKitchenwareProductPage, listKitchenwareProducts } from "@/components/store/kitchenware-template/catalog";
import { formatCedis } from "@/lib/price";
import { pickRelatedCatalogProducts } from "@/lib/related-products";
import { storefrontBase } from "@/lib/store-path";

export async function KitchenwareProductView({
  productId,
  storeSlug,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [page, catalog] = await Promise.all([
    getKitchenwareProductPage(productId, storeSlug),
    listKitchenwareProducts(storeSlug),
  ]);
  if (!page) notFound();
  const related = pickRelatedCatalogProducts(page.product, catalog, 4);
  const productBase = storefrontBase("kitchenware-template", storeSlug);

  return (
    <ProductDetail product={page.product} faqs={page.faqs}>
      {related.length > 0 ? (
        <section className="mt-16 border-t border-[#2B4239]/12 pt-12">
          <h2
            className="text-[26px] font-medium text-[#2B4239] md:text-[32px]"
            style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
          >
            Related products
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {related.map((product) => {
              const photo = product.images[0];
              return (
                <Link key={product.id} href={`${productBase}/product/${product.id}`} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#EDE8DC]">
                    {photo ? (
                      <Image src={photo} alt={product.name} fill sizes="25vw" className="object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-[15px] font-semibold leading-snug text-[#2B4239]">{product.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#2B4239]">{formatCedis(product.priceCedis)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </ProductDetail>
  );
}
