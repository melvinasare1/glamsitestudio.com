import type { Product, StoreFaq } from "@glamsite/shared/types";
import {
  RIDE_DEMO_ACCESSORIES,
  RIDE_DEMO_FAQS,
  RIDE_DEMO_FILTER_FACETS,
  RIDE_DEMO_PRODUCTS,
  getRideDemoProduct,
  rideDemoToProduct,
  type RideDemoProduct,
} from "@/components/store/motorbike-template/demo-catalog";
import {
  getLiveRideBlogPosts,
  getLiveRideFilterFacets,
  getLiveRideProduct,
  getLiveRideStorefrontSeller,
  getRideBlogPostsForStoreSlug,
  getRideFaqsForStoreSlug,
  getRideFilterFacetsForStoreSlug,
  getRideProductForStoreSlug,
  getRideSellerBySlug,
  isLiveRideCatalog,
  listLiveRideProducts,
  listRideProductsForStoreSlug,
  rideLiveStoreSlug,
} from "@/components/store/motorbike-template/live-catalog";
import { getLiveSellerFaqs } from "@/lib/live-catalog";
import { isAccessoryCategory } from "@/components/store/motorbike-template/vehicle-categories";
import {
  namedColoursFromSwatches,
  uniqueSortedNames,
  type RideCatalogCard,
  type RideFilterFacets,
} from "@/components/store/motorbike-template/search-filters";

export {
  isLiveRideCatalog,
  rideLiveStoreSlug,
  getLiveRideStorefrontSeller,
  getLiveRideBlogPosts,
  getRideSellerBySlug,
  getRideBlogPostsForStoreSlug,
};
export type { RideCatalogCard, RideFilterFacets };
export { productMatchesColour } from "@/components/store/motorbike-template/search-filters";

function productToCard(product: Product): RideCatalogCard {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCedis: product.priceCedis,
    category: product.category,
    createdAt: product.createdAt,
    image: product.images[0] ?? "",
    colors: product.colors ?? [],
    colourNames: namedColoursFromSwatches(product.colors ?? []),
    tags: product.tags ?? [],
    engineSize: product.engineSize,
    condition: product.condition,
    year: product.year,
  };
}

function demoToCard(item: RideDemoProduct): RideCatalogCard {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceCedis: item.priceCedis,
    category: item.category,
    createdAt: item.createdAt,
    image: item.image,
    colors: item.colors,
    colourNames: item.filterColours ?? namedColoursFromSwatches(item.colors),
    tags: item.tags ?? [],
    engineSize: item.engineSize,
    condition: item.condition,
    year: item.year,
    rating: item.rating,
  };
}

function mergeFacets(base: RideFilterFacets, extra: RideFilterFacets): RideFilterFacets {
  return {
    tags: uniqueSortedNames([...base.tags, ...extra.tags]),
    engineSizes: uniqueSortedNames([...base.engineSizes, ...extra.engineSizes]),
    colours: uniqueSortedNames([...base.colours, ...extra.colours]),
    years: [...new Set([...base.years, ...extra.years])].sort((a, b) => b - a),
  };
}

function facetsFromCards(products: RideCatalogCard[]): RideFilterFacets {
  return {
    tags: uniqueSortedNames(products.flatMap((product) => product.tags)),
    engineSizes: uniqueSortedNames(
      products.map((product) => product.engineSize).filter((value): value is string => Boolean(value))
    ),
    colours: uniqueSortedNames(products.flatMap((product) => product.colourNames)),
    years: [
      ...new Set(products.map((product) => product.year).filter((value): value is number => value != null)),
    ].sort((a, b) => b - a),
  };
}

/**
 * Ride product data for this storefront.
 *
 * Live seller routes pass `storeSlug` from the URL (`/store/motorbike-template/{slug}`).
 * Template preview (`/store/motorbike-template`) uses the dummy catalog, unless
 * `NEXT_PUBLIC_STORE_SLUG` is set for optional local single-tenant preview.
 */
export async function listRideProducts(storeSlug?: string): Promise<Product[]> {
  if (storeSlug) return listRideProductsForStoreSlug(storeSlug);
  if (isLiveRideCatalog()) return listLiveRideProducts();
  return RIDE_DEMO_PRODUCTS.map(rideDemoToProduct);
}

export async function getRideProduct(productId: string, storeSlug?: string): Promise<Product | null> {
  if (storeSlug) return getRideProductForStoreSlug(storeSlug, productId);
  if (isLiveRideCatalog()) return getLiveRideProduct(productId);
  const demo = getRideDemoProduct(productId);
  return demo ? rideDemoToProduct(demo) : null;
}

export async function getRideProductPage(
  productId: string,
  storeSlug?: string
): Promise<{
  product: Product;
  faqs: StoreFaq[];
} | null> {
  const product = await getRideProduct(productId, storeSlug);
  if (!product) return null;
  const faqs = storeSlug
    ? await getRideFaqsForStoreSlug(storeSlug)
    : isLiveRideCatalog()
      ? await getLiveSellerFaqs()
      : RIDE_DEMO_FAQS;
  return { product, faqs };
}

export async function listRideSearchProducts(storeSlug?: string): Promise<RideCatalogCard[]> {
  if (storeSlug) {
    return (await listRideProductsForStoreSlug(storeSlug)).map(productToCard);
  }
  if (isLiveRideCatalog()) {
    return (await listLiveRideProducts()).map(productToCard);
  }
  return RIDE_DEMO_PRODUCTS.map(demoToCard);
}

export async function getRideSearchFacets(
  products: RideCatalogCard[],
  storeSlug?: string
): Promise<RideFilterFacets> {
  const fromCatalog = facetsFromCards(products);
  if (storeSlug) {
    return mergeFacets(await getRideFilterFacetsForStoreSlug(storeSlug), fromCatalog);
  }
  if (isLiveRideCatalog()) {
    return mergeFacets(await getLiveRideFilterFacets(), fromCatalog);
  }
  return mergeFacets(
    {
      tags: RIDE_DEMO_FILTER_FACETS.tags,
      engineSizes: RIDE_DEMO_FILTER_FACETS.engineSizes,
      colours: RIDE_DEMO_FILTER_FACETS.colours,
      years: RIDE_DEMO_FILTER_FACETS.years,
    },
    fromCatalog
  );
}

export async function listRideAccessories(storeSlug?: string): Promise<RideCatalogCard[]> {
  if (storeSlug) {
    return (await listRideProductsForStoreSlug(storeSlug))
      .filter((product) => isAccessoryCategory(product.category))
      .map(productToCard);
  }
  if (isLiveRideCatalog()) {
    return (await listLiveRideProducts())
      .filter((product) => isAccessoryCategory(product.category))
      .map(productToCard);
  }
  return RIDE_DEMO_ACCESSORIES.map(demoToCard);
}
