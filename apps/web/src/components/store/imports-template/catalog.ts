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
  IMPORTS_DEMO_FAQS,
  IMPORTS_DEMO_PRODUCTS,
  getImportsDemoProduct,
  importsDemoToProduct,
} from "@/components/store/imports-template/demo-catalog";

function toSearchProduct(product: Product): CatalogSearchProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCedis: product.priceCedis,
    category: product.category,
    createdAt: product.createdAt,
    image: product.images[0] ?? "",
    colors: product.colors ?? [],
  };
}

export async function listImportsProducts(storeSlug?: string): Promise<Product[]> {
  if (storeSlug) return listProductsForStoreSlug(storeSlug);
  if (isLiveStorefrontCatalog()) return listLiveProducts();
  return IMPORTS_DEMO_PRODUCTS.map(importsDemoToProduct);
}

export async function getImportsProduct(
  productId: string,
  storeSlug?: string
): Promise<Product | null> {
  if (storeSlug) return getProductForStoreSlug(storeSlug, productId);
  if (isLiveStorefrontCatalog()) return getLiveProduct(productId);
  const demo = getImportsDemoProduct(productId);
  return demo ? importsDemoToProduct(demo) : null;
}

export async function getImportsProductPage(
  productId: string,
  storeSlug?: string
): Promise<{
  product: Product;
  faqs: StoreFaq[];
} | null> {
  const product = await getImportsProduct(productId, storeSlug);
  if (!product) return null;
  const faqs = storeSlug
    ? await getSellerFaqsForStoreSlug(storeSlug)
    : isLiveStorefrontCatalog()
      ? await getLiveSellerFaqs()
      : IMPORTS_DEMO_FAQS;
  return { product, faqs };
}

export async function listImportsSearchProducts(
  storeSlug?: string
): Promise<CatalogSearchProduct[]> {
  return (await listImportsProducts(storeSlug)).map(toSearchProduct);
}
