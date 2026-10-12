"use client";

import { useEffect, useState } from "react";
import { useSeller } from "@/lib/seller-context";
import { createClient } from "@glamsite/shared/supabase/client";
import type { Product } from "@glamsite/shared/types";

type ProductQuickEditDialogProps = {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function ProductQuickEditDialog({
  open,
  product,
  onOpenChange,
  onSaved,
}: ProductQuickEditDialogProps) {
  const { seller } = useSeller();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open || !product) return;
    setError(null);
    setName(product.name);
    setPrice(String(product.priceCedis));
    setActive(product.active);
  }, [open, product]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seller || !product) {
      setError("No seller profile is linked to this account.");
      return;
    }

    const title = name.trim();
    const priceCedis = Number(price);
    if (!title || !Number.isFinite(priceCedis) || priceCedis < 0) {
      setError("Name and a valid price are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: title,
          price_cedis: priceCedis,
          active,
        })
        .eq("id", product.id)
        .eq("seller_id", seller.id);
      if (updateError) throw updateError;
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error("Failed to quick-edit product", err);
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/40 px-4 py-10"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-quick-edit-title"
        className="w-full max-w-lg rounded-xl border border-black/8 bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="product-quick-edit-title" className="text-lg font-semibold text-ink-950">
              Quick edit
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Name, price, and storefront visibility only. Use Edit for variants and images.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-ink-950"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-950">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-black/8 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-950">Price (GHS)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-black/8 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-950">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="accent-ink-950"
            />
            Active on storefront
          </label>

          {error ? <p className="text-sm text-delta-down">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-ink-950"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink-950 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
