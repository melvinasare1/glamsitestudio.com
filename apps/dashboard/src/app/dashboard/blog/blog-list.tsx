"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { BlogFormDialog } from "./blog-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeller } from "@/lib/seller-context";
import { blogPostFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { StoreBlogPost } from "@glamsite/shared/types";

function formatPostDate(ms: number): string {
  if (!ms) return "Not set";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogList() {
  const { seller } = useSeller();
  const [posts, setPosts] = useState<StoreBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<StoreBlogPost | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoreBlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("store_blog_posts")
          .select("*")
          .eq("seller_id", sellerKey)
          .order("published_at", { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        setPosts((data ?? []).map(blogPostFromRow));
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load blog posts", err);
        if (!cancelled) {
          setLoadError("Could not load blog posts from Supabase.");
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
      all: posts.length,
      published: posts.filter((post) => post.published).length,
      draft: posts.filter((post) => !post.published).length,
    }),
    [posts]
  );

  function reload() {
    setReloadToken((n) => n + 1);
  }

  async function togglePublished(post: StoreBlogPost) {
    if (!sellerKey) return;
    const nextPublished = !post.published;
    setActionError(null);
    setPosts((prev) =>
      prev.map((row) => (row.id === post.id ? { ...row, published: nextPublished } : row))
    );
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_blog_posts")
        .update({ published: nextPublished, updated_at: new Date().toISOString() })
        .eq("id", post.id)
        .eq("seller_id", sellerKey);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to toggle post", err);
      setPosts((prev) =>
        prev.map((row) => (row.id === post.id ? { ...row, published: post.published } : row))
      );
      setActionError("Could not update this post.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !sellerKey) return;
    setDeleting(true);
    setActionError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_blog_posts")
        .delete()
        .eq("id", pendingDelete.id)
        .eq("seller_id", sellerKey);
      if (error) throw error;
      setPosts((prev) => prev.filter((row) => row.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      console.error("Failed to delete post", err);
      setActionError("Could not delete this post.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-950">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Posts you publish show up in Recent Blog Posts on your Ride storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingPost(null);
            setFormOpen(true);
          }}
          className="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
        >
          New post
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {counts.all} post{counts.all === 1 ? "" : "s"} · {counts.published} published · {counts.draft}{" "}
        draft
      </p>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {actionError ? <p className="mt-4 text-sm text-delta-down">{actionError}</p> : null}

      {loading ? <BlogTableSkeleton /> : null}

      {!loading && !loadError && posts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-black/8 bg-white px-5 py-16 text-center">
          <p className="text-base font-medium text-ink-950">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a post with a cover image, title, and short excerpt.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingPost(null);
              setFormOpen(true);
            }}
            className="mt-5 inline-flex rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
          >
            New post
          </button>
        </div>
      ) : null}

      {!loading && !loadError && posts.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-muted/70 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-black/6 last:border-0">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <PostThumb title={post.title} src={post.imageUrl} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink-950">{post.title}</p>
                          {post.excerpt ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{post.excerpt}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatPostDate(post.publishedAt)}</td>
                    <td className="px-4 py-3.5 text-ink-950">
                      {post.published ? "Published" : "Draft"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${post.title}`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-ink-950"
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingPost(post);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => togglePublished(post)}>
                            {post.published ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(post)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <BlogFormDialog
        key={editingPost?.id ?? "create"}
        open={formOpen}
        post={editingPost}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPost(null);
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
            aria-labelledby="delete-post-title"
            className="w-full max-w-sm rounded-xl border border-black/8 bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-post-title" className="text-lg font-semibold text-ink-950">
              Delete post
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete “{pendingDelete.title}”? This cannot be undone.
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

function PostThumb({ title, src }: { title: string; src?: string }) {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(src) && !broken;

  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
      {showImg ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {title.charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

function BlogTableSkeleton() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-white">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-black/6 px-4 py-3.5 last:border-0">
          <Skeleton className="size-12 rounded-md" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
