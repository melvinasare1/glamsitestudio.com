import type { SupabaseClient } from "@supabase/supabase-js";
import { blogPostFromRow, productFromRow, sellerFromRow } from "@glamsite/shared/mappers";
import type { StorefrontContent } from "@glamsite/shared/storefront-content-schema";
import type { Product, StoreBlogPost, StoreFaq, StorefrontTemplate } from "@glamsite/shared/types";

export type StorefrontSeller = {
  id: string;
  storeSlug: string;
  businessName: string;
  phone: string;
  template: StorefrontTemplate;
  storeContent: StorefrontContent;
  faqs: StoreFaq[];
};

export async function getSellerByStoreSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<StorefrontSeller | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("sellers")
    .select("id, store_slug, business_name, phone, template, store_content, faqs")
    .eq("store_slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load seller by slug", error);
    return null;
  }
  if (!data) return null;

  const seller = sellerFromRow(data);
  return {
    id: seller.id,
    storeSlug: seller.storeSlug,
    businessName: seller.businessName,
    phone: seller.phone,
    template: seller.template,
    storeContent: seller.storeContent,
    faqs: seller.faqs,
  };
}

export async function getActiveProductsForSeller(
  supabase: SupabaseClient,
  sellerId: string
): Promise<Product[]> {
  if (!sellerId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load storefront products", error);
    return [];
  }

  return (data ?? []).map(productFromRow);
}

export async function getStorefrontProduct(
  supabase: SupabaseClient,
  productId: string,
  sellerId: string
): Promise<Product | null> {
  if (!productId || !sellerId) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load storefront product", error);
    return null;
  }
  if (!data) return null;

  const product = productFromRow(data);
  if (product.sellerId !== sellerId || !product.active) return null;
  return product;
}

export async function getPublishedBlogPosts(
  supabase: SupabaseClient,
  sellerId: string,
  limit = 3
): Promise<StoreBlogPost[]> {
  if (!sellerId) return [];

  const { data, error } = await supabase
    .from("store_blog_posts")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load storefront blog posts", error);
    return [];
  }

  return (data ?? []).map(blogPostFromRow);
}

export async function getPublishedBlogPost(
  supabase: SupabaseClient,
  sellerId: string,
  postId: string
): Promise<StoreBlogPost | null> {
  if (!sellerId || !postId) return null;

  const { data, error } = await supabase
    .from("store_blog_posts")
    .select("*")
    .eq("id", postId)
    .eq("seller_id", sellerId)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load storefront blog post", error);
    return null;
  }
  if (!data) return null;

  return blogPostFromRow(data);
}
