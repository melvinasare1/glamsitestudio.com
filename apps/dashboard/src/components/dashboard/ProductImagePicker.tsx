"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGE_ACCEPT,
  uploadProductImage,
  validateProductImage,
} from "@/lib/product-images";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ImageSlotStatus = "ready" | "uploading" | "uploaded" | "error";

export type ImageSlot = {
  id: string;
  previewUrl: string;
  file?: File;
  publicUrl?: string;
  status: ImageSlotStatus;
  progress: number;
  error?: string;
};

function revokeIfBlob(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function slotsFromUrls(urls: string[]): ImageSlot[] {
  return urls.slice(0, MAX_PRODUCT_IMAGES).map((url) => ({
    id: url,
    previewUrl: url,
    publicUrl: url,
    status: "uploaded" as const,
    progress: 100,
  }));
}

export function useProductImageSlots(initialSlots: ImageSlot[] = []) {
  const [slots, setSlots] = useState<ImageSlot[]>(initialSlots);
  const [error, setError] = useState<string | null>(null);
  const slotsRef = useRef<ImageSlot[]>([]);
  slotsRef.current = slots;

  useEffect(() => {
    return () => {
      for (const slot of slotsRef.current) revokeIfBlob(slot.previewUrl);
    };
  }, []);

  function patchSlot(id: string, patch: Partial<ImageSlot>) {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  function removeSlot(id: string) {
    setSlots((prev) => {
      const next: ImageSlot[] = [];
      for (const slot of prev) {
        if (slot.id === id) {
          revokeIfBlob(slot.previewUrl);
        } else {
          next.push(slot);
        }
      }
      return next;
    });
  }

  function handleFilesSelected(list: FileList | null) {
    if (!list?.length) return;
    const remaining = MAX_PRODUCT_IMAGES - slotsRef.current.length;
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }

    const incoming = Array.from(list);
    const accepted = incoming.slice(0, remaining);
    const overflow = incoming.length - accepted.length;
    const nextSlots: ImageSlot[] = accepted.map((file) => {
      const validationError = validateProductImage(file);
      return {
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        file,
        status: validationError ? "error" : "ready",
        progress: 0,
        error: validationError ?? undefined,
      };
    });

    setSlots((prev) => [...prev, ...nextSlots]);
    if (overflow > 0) {
      setError(
        `Only ${MAX_PRODUCT_IMAGES} images are allowed. ${overflow} extra file${
          overflow === 1 ? " was" : "s were"
        } not added.`
      );
    } else {
      const invalid = nextSlots.filter((slot) => slot.status === "error").length;
      setError(
        invalid
          ? `${invalid} image${invalid === 1 ? "" : "s"} could not be added. See the thumbnail${
              invalid === 1 ? "" : "s"
            } below.`
          : null
      );
    }
  }

  async function uploadAll(
    supabase: SupabaseClient,
    sellerId: string
  ): Promise<Array<{ id: string; url: string }>> {
    const uploadResults = await Promise.all(
      slotsRef.current.map(async (slot) => {
        if (slot.publicUrl) {
          return { id: slot.id, url: slot.publicUrl, error: null };
        }
        if (!slot.file) {
          const message = slot.error ?? "This image is missing a file to upload.";
          patchSlot(slot.id, { status: "error", error: message });
          return { id: slot.id, url: null, error: message };
        }

        const validationError = validateProductImage(slot.file);
        if (validationError) {
          patchSlot(slot.id, { status: "error", error: validationError, progress: 0 });
          return { id: slot.id, url: null, error: validationError };
        }

        patchSlot(slot.id, { status: "uploading", progress: 0, error: undefined });
        try {
          const url = await uploadProductImage(supabase, sellerId, slot.file, (percent) => {
            patchSlot(slot.id, { progress: percent, status: "uploading" });
          });
          patchSlot(slot.id, {
            status: "uploaded",
            publicUrl: url,
            progress: 100,
            error: undefined,
          });
          return { id: slot.id, url, error: null };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed.";
          patchSlot(slot.id, { status: "error", error: message, progress: 0 });
          return { id: slot.id, url: null, error: message };
        }
      })
    );

    const failed = uploadResults.filter((result) => result.error);
    if (failed.length > 0) {
      const message =
        failed.length === 1
          ? `Could not upload an image: ${failed[0].error}`
          : `Could not upload ${failed.length} images. Fix the errors on the thumbnails and try again.`;
      setError(message);
      throw new Error(message);
    }

    setError(null);
    return uploadResults
      .filter((result): result is { id: string; url: string; error: null } => Boolean(result.url))
      .map((result) => ({ id: result.id, url: result.url }));
  }

  return {
    slots,
    error,
    setError,
    handleFilesSelected,
    removeSlot,
    uploadAll,
  };
}

export function ProductImagePicker({
  slots,
  disabled,
  onFilesSelected,
  onRemove,
  renderSlotExtra,
}: {
  slots: ImageSlot[];
  disabled?: boolean;
  onFilesSelected: (list: FileList | null) => void;
  onRemove: (id: string) => void;
  renderSlotExtra?: (slot: ImageSlot) => ReactNode;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = slots.length < MAX_PRODUCT_IMAGES && !disabled;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!canAddMore) return;
    onFilesSelected(event.dataTransfer.files);
  }

  return (
    <div>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={handleDrop}
      >
        {slots.map((slot) => (
          <div key={slot.id} className="space-y-2">
            <ImageSlotThumb
              slot={slot}
              disabled={Boolean(disabled)}
              onRemove={() => onRemove(slot.id)}
            />
            {renderSlotExtra ? renderSlotExtra(slot) : null}
          </div>
        ))}
        {canAddMore ? (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/15 bg-muted/40 text-muted-foreground hover:border-brand hover:text-ink-950"
          >
            <ImagePlusIcon className="size-5" />
            <span className="text-[11px] font-medium">Add images</span>
          </button>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Upload product images"
        disabled={!canAddMore}
        onChange={(event) => {
          onFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Select or drop several files at once. Up to {MAX_PRODUCT_IMAGES} images (JPEG, PNG, WebP, or
        GIF), 5 MB each.
      </p>
    </div>
  );
}

function ImageSlotThumb({
  slot,
  disabled,
  onRemove,
}: {
  slot: ImageSlot;
  disabled: boolean;
  onRemove: () => void;
}) {
  const uploading = slot.status === "uploading";
  const failed = slot.status === "error";

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg border bg-muted ${
        failed ? "border-delta-down" : "border-black/8"
      }`}
    >
      {/* User-supplied / blob URLs are not limited to next/image remotePatterns. */}
      <img src={slot.previewUrl} alt="" className="size-full object-cover" />
      {uploading ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-950/55 px-1 text-white"
          aria-busy="true"
          aria-label={`Uploading ${slot.progress}%`}
        >
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-[11px] font-medium tabular-nums">{slot.progress}%</span>
        </div>
      ) : null}
      {failed ? (
        <div
          className="absolute inset-x-0 bottom-0 bg-delta-down px-1 py-0.5 text-[10px] leading-tight text-white"
          title={slot.error ?? "Upload failed"}
        >
          Upload failed
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || uploading}
        aria-label="Remove image"
        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-ink-950/70 text-white disabled:opacity-40"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}
