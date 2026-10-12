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
  TEMPLATE_A_DEMO_FAQS,
  TEMPLATE_A_DEMO_PRODUCTS,
  getTemplateADemoProduct,
  templateADemoToProduct,
} from "@/components/store/template-a/demo-catalog";

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

export async function listTemplateAProducts(storeSlug?: string): Promise<Product[]> {
  if (storeSlug) return listProductsForStoreSlug(storeSlug);
  if (isLiveStorefrontCatalog()) return listLiveProducts();
  return TEMPLATE_A_DEMO_PRODUCTS.map(templateADemoToProduct);
}

export async function getTemplateAProduct(
  productId: string,
  storeSlug?: string
): Promise<Product | null> {
  if (storeSlug) return getProductForStoreSlug(storeSlug, productId);
  if (isLiveStorefrontCatalog()) return getLiveProduct(productId);
  const demo = getTemplateADemoProduct(productId);
  return demo ? templateADemoToProduct(demo) : null;
}

export async function getTemplateAProductPage(
  productId: string,
  storeSlug?: string
): Promise<{
  product: Product;
  faqs: StoreFaq[];
} | null> {
  const product = await getTemplateAProduct(productId, storeSlug);
  if (!product) return null;
  const faqs = storeSlug
    ? await getSellerFaqsForStoreSlug(storeSlug)
    : isLiveStorefrontCatalog()
      ? await getLiveSellerFaqs()
      : TEMPLATE_A_DEMO_FAQS;
  return { product, faqs };
}

export async function listTemplateASearchProducts(
  storeSlug?: string
): Promise<CatalogSearchProduct[]> {
  return (await listTemplateAProducts(storeSlug)).map(toSearchProduct);
}
