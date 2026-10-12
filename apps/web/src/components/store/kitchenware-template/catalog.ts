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
import { formatCedis } from "@/lib/price";
import {
  KITCHENWARE_DEMO_FAQS,
  KITCHENWARE_DEMO_PRODUCTS,
  getKitchenwareDemoProduct,
  kitchenwareDemoToProduct,
} from "@/components/store/kitchenware-template/demo-catalog";
import type { KitchenProduct } from "@/components/store/kitchenware-template/ProductCarousel";
import {
  uniqueSortedNames,
  type KitchenwareCatalogCard,
  type KitchenwareFilterFacets,
} from "@/components/store/kitchenware-template/search-filters";

const BADGES: KitchenProduct["badge"][] = ["Promotion", "New", "Customer favorite"];

function productToCard(product: Product): KitchenwareCatalogCard {
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

function facetsFromCards(products: KitchenwareCatalogCard[]): KitchenwareFilterFacets {
  return {
    categories: uniqueSortedNames(products.map((product) => product.category)),
  };
}

export async function listKitchenwareProducts(storeSlug?: string): Promise<Product[]> {
  if (storeSlug) return listProductsForStoreSlug(storeSlug);
  if (isLiveStorefrontCatalog()) return listLiveProducts();
  return KITCHENWARE_DEMO_PRODUCTS.map(kitchenwareDemoToProduct);
}

export async function getKitchenwareProduct(
  productId: string,
  storeSlug?: string
): Promise<Product | null> {
  if (storeSlug) return getProductForStoreSlug(storeSlug, productId);
  if (isLiveStorefrontCatalog()) return getLiveProduct(productId);
  const demo = getKitchenwareDemoProduct(productId);
  return demo ? kitchenwareDemoToProduct(demo) : null;
}

export async function getKitchenwareProductPage(
  productId: string,
  storeSlug?: string
): Promise<{
  product: Product;
  faqs: StoreFaq[];
} | null> {
  const product = await getKitchenwareProduct(productId, storeSlug);
  if (!product) return null;
  const faqs = storeSlug
    ? await getSellerFaqsForStoreSlug(storeSlug)
    : isLiveStorefrontCatalog()
      ? await getLiveSellerFaqs()
      : KITCHENWARE_DEMO_FAQS;
  return { product, faqs };
}

export function productToKitchenCard(product: Product, index: number): KitchenProduct {
  return {
    id: product.id,
    name: product.name,
    price: formatCedis(product.priceCedis),
    priceCedis: product.priceCedis,
    badge: BADGES[index % BADGES.length],
    colors: product.colors?.length ? product.colors : ["#2B4239", "#C4B89A"],
    image: product.images[0] ?? "",
    imageAlt: product.name,
  };
}

export async function listKitchenwareCarousel(storeSlug?: string): Promise<KitchenProduct[]> {
  return (await listKitchenwareProducts(storeSlug)).map(productToKitchenCard);
}

/**
 * Kitchenware search catalog.
 *
 * Live seller routes pass `storeSlug` from the URL.
 * Template preview (`/store/kitchenware-template`) uses the dummy catalog,
 * unless `NEXT_PUBLIC_STORE_SLUG` is set for optional local preview.
 */
export async function listKitchenwareSearchProducts(
  storeSlug?: string
): Promise<KitchenwareCatalogCard[]> {
  return (await listKitchenwareProducts(storeSlug)).map(productToCard);
}

export async function getKitchenwareSearchFacets(
  products: KitchenwareCatalogCard[]
): Promise<KitchenwareFilterFacets> {
  return facetsFromCards(products);
}
