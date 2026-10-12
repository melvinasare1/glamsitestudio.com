"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { blogPostToInsert } from "@glamsite/shared/mappers";
import { useSeller } from "@/lib/seller-context";
import {
  PRODUCT_IMAGE_ACCEPT,
  uploadProductImage,
  validateProductImage,
} from "@/lib/product-images";
import { createClient } from "@glamsite/shared/supabase/client";
import type { StoreBlogPost } from "@glamsite/shared/types";

const FIELD_CLASS =
  "mt-1.5 w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-muted-foreground focus:border-brand";

function toDateInput(ms: number): string {
  if (!ms) return new Date().toISOString().slice(0, 10);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BlogFormDialog({
  open,
  post,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  post?: StoreBlogPost | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { seller } = useSeller();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [publishedOn, setPublishedOn] = useState(toDateInput(Date.now()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(post);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(post?.title ?? "");
    setExcerpt(post?.excerpt ?? "");
    setBody(post?.body ?? "");
    setImageUrl(post?.imageUrl ?? "");
    setPublished(post?.published ?? true);
    setPublishedOn(toDateInput(post?.publishedAt ?? Date.now()));
  }, [open, post]);

  if (!open) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seller?.id) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Add a title before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const publishedAt = Date.parse(`${publishedOn}T12:00:00`);
      const payload = blogPostToInsert({
        sellerId: seller.id,
        title: trimmedTitle,
        excerpt: excerpt.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim(),
        published,
        publishedAt: Number.isFinite(publishedAt) ? publishedAt : Date.now(),
      });
      const supabase = createClient();
      if (isEdit && post) {
        const { error: updateError } = await supabase
          .from("store_blog_posts")
          .update(payload)
          .eq("id", post.id)
          .eq("seller_id", seller.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("store_blog_posts").insert(payload);
        if (insertError) throw insertError;
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/40 px-4 py-10"
      onClick={() => (saving ? null : onOpenChange(false))}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-form-title"
        className="w-full max-w-lg rounded-xl border border-black/8 bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="blog-form-title" className="text-lg font-semibold text-ink-950">
          {isEdit ? "Edit post" : "New post"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Published posts appear in Recent Blog Posts on your Ride storefront.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="blog-title" className="text-sm font-medium text-ink-950">
              Title
            </label>
            <input
              id="blog-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Sunday loop: Labadi to the hills and back"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="blog-excerpt" className="text-sm font-medium text-ink-950">
              Excerpt
            </label>
            <textarea
              id="blog-excerpt"
              rows={3}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="A short preview shown on the home page card."
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="blog-body" className="text-sm font-medium text-ink-950">
              Body
            </label>
            <textarea
              id="blog-body"
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="The full post. Shown when a visitor taps Read More."
              className={FIELD_CLASS}
            />
          </div>
          <CoverImageField
            value={imageUrl}
            sellerId={seller?.id ?? ""}
            disabled={saving}
            onChange={setImageUrl}
          />
          <div>
            <label htmlFor="blog-date" className="text-sm font-medium text-ink-950">
              Published date
            </label>
            <input
              id="blog-date"
              type="date"
              value={publishedOn}
              onChange={(event) => setPublishedOn(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-950">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="size-4 rounded border-black/20"
            />
            Published on the storefront
          </label>

          {error ? <p className="text-sm text-delta-down">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-ink-950"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-ink-950 px-5 py-2 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save post" : "Create post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CoverImageField({
  value,
  sellerId,
  disabled,
  onChange,
}: {
  value: string;
  sellerId: string;
  disabled: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file || !sellerId) return;
    const validationError = validateProductImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const supabase = createClient();
      const url = await uploadProductImage(supabase, sellerId, file, setProgress);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink-950">Cover image</p>
      {value ? (
        <div className="relative mt-1.5 mb-3 h-36 w-full overflow-hidden rounded-lg border border-black/8 bg-mist">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled || uploading}
            aria-label="Remove cover image"
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink-950/70 text-white disabled:opacity-40"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || !sellerId}
        className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/12 px-4 py-3 text-sm font-medium text-ink-700 hover:border-brand hover:text-ink-950 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Uploading {progress}%
          </>
        ) : (
          <>
            <ImagePlusIcon className="size-4" />
            {value ? "Replace image" : "Upload a cover image"}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />
      {error ? <p className="mt-1.5 text-xs text-delta-down">{error}</p> : null}
    </div>
  );
}
