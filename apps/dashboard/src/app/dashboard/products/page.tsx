"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import ProductQuickEditDialog from "@/components/dashboard/ProductQuickEditDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSeller } from "@/lib/seller-context";
import { productFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Product } from "@glamsite/shared/types";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "out_of_stock" | "draft";
type SortKey = "name" | "sku" | "variation" | "price" | "stock" | "created" | "updated";
type SortDir = "asc" | "desc";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "out_of_stock", label: "Out of stock" },
  { id: "draft", label: "Draft" },
];

function matchesStatus(product: Product, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return product.active && product.stockQuantity > 0;
  if (filter === "out_of_stock") return product.stockQuantity === 0;
  return !product.active;
}

function variationCount(product: Product): number {
  const sizes = product.sizes?.length ?? 0;
  const colors = product.colors?.length ?? 0;
  if (!sizes && !colors) return 0;
  return (sizes || 1) * (colors || 1);
}

function formatProductDate(ms: number): string {
  if (!ms) return "Not set";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(cedis: number): string {
  return `GHS ${cedis.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function compareProducts(a: Product, b: Product, key: SortKey, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name) * sign;
    case "sku":
      return a.sku.localeCompare(b.sku) * sign;
    case "variation":
      return (variationCount(a) - variationCount(b)) * sign;
    case "price":
      return (a.priceCedis - b.priceCedis) * sign;
    case "stock":
      return (a.stockQuantity - b.stockQuantity) * sign;
    case "created":
    case "updated":
      // products has no updated_at column; last updated falls back to created_at.
      return (a.createdAt - b.createdAt) * sign;
    default:
      return 0;
  }
}

function pageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && page - prev > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

export default function ProductsPage() {
  const router = useRouter();
  const { seller } = useSeller();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("seller_id", sellerKey)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        setProducts((data ?? []).map(productFromRow));
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load products", err);
        if (!cancelled) {
          setLoadError("Could not load products from Supabase.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sellerKey, reloadToken]);

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((product) => product.active && product.stockQuantity > 0).length,
      out_of_stock: products.filter((product) => product.stockQuantity === 0).length,
      draft: products.filter((product) => !product.active).length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((product) => matchesStatus(product, statusFilter))
      .sort((a, b) => compareProducts(a, b, sortKey, sortDir));
  }, [products, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageIds = pageRows.map((row) => row.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  function reload() {
    setReloadToken((n) => n + 1);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "created" || key === "updated" ? "desc" : "asc");
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of pageIds) next.add(id);
      } else {
        for (const id of pageIds) next.delete(id);
      }
      return next;
    });
  }

  async function toggleActive(product: Product) {
    setActionError(null);
    const nextActive = !product.active;
    setProducts((prev) =>
      prev.map((row) => (row.id === product.id ? { ...row, active: nextActive } : row))
    );
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ active: nextActive })
        .eq("id", product.id)
        .eq("seller_id", sellerKey);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to toggle product", err);
      setProducts((prev) =>
        prev.map((row) => (row.id === product.id ? { ...row, active: product.active } : row))
      );
      setActionError("Could not update this product.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !sellerKey) return;
    setDeleting(true);
    setActionError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", pendingDelete.id)
        .eq("seller_id", sellerKey);
      if (error) throw error;
      setProducts((prev) => prev.filter((row) => row.id !== pendingDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
      setPendingDelete(null);
    } catch (err) {
      console.error("Failed to delete product", err);
      setActionError("Could not delete this product.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
        >
          Add New Product
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const count = counts[tab.id];
            const selected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border border-black/8 bg-muted text-ink-950"
                    : "text-muted-foreground hover:text-ink-950"
                )}
              >
                {tab.label}({count})
              </button>
            );
          })}
        </div>
        {/* Export is visual-only for now. CSV/download is not wired. */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/8 bg-white px-3 py-1.5 text-sm text-ink-950"
        >
          Export
          <ArrowDownIcon className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-4 text-sm text-delta-down">{actionError}</p>
      ) : null}

      {loading ? <ProductsTableSkeleton /> : null}

      {!loading && !loadError && products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-black/8 bg-white px-5 py-16 text-center">
          <p className="text-base font-medium text-ink-950">No products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one to populate this catalog from Supabase.
          </p>
          <Link
            href="/dashboard/products/new"
            className="mt-5 inline-flex rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
          >
            Add New Product
          </Link>
        </div>
      ) : null}

      {!loading && !loadError && products.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-muted/70 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      aria-label="Select all products on this page"
                      checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                      onCheckedChange={(value) => toggleSelectAll(value === true)}
                    />
                  </th>
                  <SortableHead label="Product" active={sortKey === "name"} onClick={() => toggleSort("name")} />
                  <SortableHead label="SKU" active={sortKey === "sku"} onClick={() => toggleSort("sku")} />
                  <SortableHead
                    label="Variation"
                    active={sortKey === "variation"}
                    onClick={() => toggleSort("variation")}
                  />
                  <SortableHead label="Price" active={sortKey === "price"} onClick={() => toggleSort("price")} />
                  <SortableHead label="Stock" active={sortKey === "stock"} onClick={() => toggleSort("stock")} />
                  <SortableHead
                    label="Created"
                    active={sortKey === "created"}
                    onClick={() => toggleSort("created")}
                  />
                  <SortableHead
                    label="Last updated"
                    active={sortKey === "updated"}
                    onClick={() => toggleSort("updated")}
                  />
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      No products match this filter.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((product) => {
                    const variations = variationCount(product);
                    return (
                      <tr key={product.id} className="border-b border-black/6 last:border-0">
                        <td className="px-4 py-3.5">
                          <Checkbox
                            aria-label={`Select ${product.name}`}
                            checked={selectedIds.has(product.id)}
                            onCheckedChange={(value) => toggleRow(product.id, value === true)}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <ProductThumb name={product.name} src={product.images[0]} />
                            <span className="font-medium text-ink-950">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                          {product.sku || "Not set"}
                        </td>
                        <td className="px-4 py-3.5 text-ink-950">{variations > 0 ? variations : "None"}</td>
                        <td className="px-4 py-3.5 font-tabular text-ink-950">
                          {formatPrice(product.priceCedis)}
                        </td>
                        <td className="px-4 py-3.5 text-ink-950">{product.stockQuantity}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatProductDate(product.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatProductDate(product.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              aria-label={`Actions for ${product.name}`}
                              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-ink-950"
                            >
                              <MoreHorizontalIcon className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-40">
                              <DropdownMenuItem
                                onSelect={() => router.push(`/dashboard/products/${product.id}`)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditingProduct(product);
                                  setFormOpen(true);
                                }}
                              >
                                Quick edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => toggleActive(product)}>
                                Toggle active
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(product)}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-2 py-4">
            <button
              type="button"
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-950 disabled:text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pageList(currentPage, totalPages).map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      "min-w-8 rounded-lg px-2 py-1.5 text-sm tabular-nums",
                      item === currentPage
                        ? "bg-muted font-medium text-ink-950"
                        : "text-muted-foreground hover:text-ink-950"
                    )}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-950 disabled:text-muted-foreground"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <ProductQuickEditDialog
        key={editingProduct?.id ?? "quick-edit"}
        open={formOpen}
        product={editingProduct}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSaved={reload}
      />

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4"
          onClick={() => (deleting ? null : setPendingDelete(null))}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-sm rounded-xl border border-black/8 bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-product-title" className="text-lg font-semibold text-ink-950">
              Delete product
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete “{pendingDelete.name}”? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-ink-950"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-full bg-delta-down px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortableHead({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 uppercase",
          active ? "text-ink-950" : "text-muted-foreground"
        )}
      >
        {label}
        <ChevronsUpDownIcon className="size-3" />
      </button>
    </th>
  );
}

function ProductThumb({ name, src }: { name: string; src?: string }) {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(src) && !broken;

  return (
    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
      {showImg ? (
        // User-supplied URLs are not limited to next/image remotePatterns.
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {name.charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-white">
      <div className="space-y-0">
        <div className="flex items-center gap-4 border-b border-black/6 bg-muted/70 px-4 py-3">
          <Skeleton className="size-4" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-black/6 px-4 py-3.5 last:border-0">
            <Skeleton className="size-4" />
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
