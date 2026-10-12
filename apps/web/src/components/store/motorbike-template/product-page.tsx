import { notFound } from "next/navigation";
import { RideAccessoryCard } from "@/components/store/motorbike-template/accessory-card";
import { getRideProductPage, listRideProducts } from "@/components/store/motorbike-template/catalog";
import { RideProductDetail } from "@/components/store/motorbike-template/product-detail";
import { pickRelatedProducts } from "@/components/store/motorbike-template/vehicle-categories";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";

export async function RideProductPage({
  productId,
  storeSlug,
  pathBase,
}: {
  productId: string;
  storeSlug: string;
  pathBase: string;
}) {
  const sellerSlug = storeSlug && storeSlug !== "motorbike-template" ? storeSlug : undefined;
  const [page, catalog] = await Promise.all([
    getRideProductPage(productId, sellerSlug),
    listRideProducts(sellerSlug),
  ]);
  if (!page) {
    notFound();
  }

  const { product, faqs } = page;
  const related = pickRelatedProducts(product, catalog, 4);
  const productHref = `${pathBase}/product/${product.id}`;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-16">
      <StorefrontTracker storeSlug={storeSlug} path={productHref} productId={product.id} />
      <RideProductDetail product={product} faqs={faqs}>
        {related.length > 0 ? (
          <section className="mt-16 md:mt-20">
            <h2
              className="text-[32px] font-extrabold tracking-tight text-[#141414] md:text-[40px]"
              style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
            >
              Related products
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <RideAccessoryCard
                  key={item.id}
                  href={`${pathBase}/product/${item.id}`}
                  productId={item.id}
                  name={item.name}
                  priceCedis={item.priceCedis}
                  image={item.images[0] ?? ""}
                  colors={item.colors ?? []}
                />
              ))}
            </div>
          </section>
        ) : null}
      </RideProductDetail>
    </div>
  );
}
