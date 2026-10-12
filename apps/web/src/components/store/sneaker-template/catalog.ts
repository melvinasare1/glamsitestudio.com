import type { Product, StoreFaq } from "@glamsite/shared/types";
import {
  getLiveProduct,
  getLiveSellerFaqs,
  getProductForStoreSlug,
  getSellerFaqsForStoreSlug,
  isLiveStorefrontCatalog,
  listLiveProducts,
  listProductsForStoreSlug,
} from "@/lib/live-catalog";
import type { CatalogSearchProduct } from "@/components/store/catalog-search-types";
import {
  SNEAKER_DEMO_FAQS,
  SNEAKER_DEMO_PRODUCTS,
  getSneakerDemoProduct,
  sneakerDemoToProduct,
} from "@/components/store/sneaker-template/demo-catalog";

function toSearchProduct(product: Product): CatalogSearchProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCedis: product.priceCedis,
    category: product.category,
    createdAt: product.createdAt,
    image: product.images[0] ?? "",
  };
}

export async function listSneakerProducts(storeSlug?: string): Promise<Product[]> {
  if (storeSlug) return listProductsForStoreSlug(storeSlug);
  if (isLiveStorefrontCatalog()) return listLiveProducts();
  return SNEAKER_DEMO_PRODUCTS.map(sneakerDemoToProduct);
}

export async function getSneakerProduct(
  productId: string,
  storeSlug?: string
): Promise<Product | null> {
  if (storeSlug) return getProductForStoreSlug(storeSlug, productId);
  if (isLiveStorefrontCatalog()) return getLiveProduct(productId);
  const demo = getSneakerDemoProduct(productId);
  return demo ? sneakerDemoToProduct(demo) : null;
}

export async function getSneakerProductPage(
  productId: string,
  storeSlug?: string
): Promise<{
  product: Product;
  faqs: StoreFaq[];
} | null> {
  const product = await getSneakerProduct(productId, storeSlug);
  if (!product) return null;
  const faqs = storeSlug
    ? await getSellerFaqsForStoreSlug(storeSlug)
    : isLiveStorefrontCatalog()
      ? await getLiveSellerFaqs()
      : SNEAKER_DEMO_FAQS;
  return { product, faqs };
}

export async function listSneakerSearchProducts(
  storeSlug?: string
): Promise<CatalogSearchProduct[]> {
  return (await listSneakerProducts(storeSlug)).map(toSearchProduct);
}
