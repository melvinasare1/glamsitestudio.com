"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NewProductForm } from "../new/new-product-form";
import { useSeller } from "@/lib/seller-context";
import { productFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Product } from "@glamsite/shared/types";

export default function EditProductPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { seller } = useSeller();
  const sellerKey = seller?.id ?? null;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !sellerKey || !isSupabaseConfigured()) {
      setProduct(null);
      setLoading(false);
      if (!isSupabaseConfigured()) setError("Supabase is not configured.");
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("seller_id", sellerKey)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) throw queryError;
        setProduct(data ? productFromRow(data) : null);
        setError(data ? null : "This product was not found.");
      } catch (err) {
        console.error("Failed to load product", err);
        if (!cancelled) {
          setProduct(null);
          setError("Could not load this product.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, sellerKey]);

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-8 lg:px-6">
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 pt-6 pb-8 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">Edit product</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error ?? "This product was not found."}</p>
        <Link href="/dashboard/products" className="mt-4 inline-block text-sm font-medium text-ink-950 hover:text-ink-800">
          Back to products
        </Link>
      </div>
    );
  }

  return <NewProductForm key={product.id} product={product} />;
}
