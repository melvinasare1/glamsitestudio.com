"use client";

/* eslint-disable @next/next/no-img-element -- public storage URLs at unknown sizes */
import { useRef, useState } from "react";
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@glamsite/shared/supabase/client";
import { IMAGE_ACCEPT, uploadSiteImage } from "@/lib/media";
import { cn } from "@/lib/utils";

/** Upload one image to the business's media folder; stores its public URL. */
export function ImageInput({
  businessId,
  value,
  onChange,
  aspect = "wide",
  disabled,
}: {
  businessId: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "wide" | "square";
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const url = await uploadSiteImage(createClient(), businessId, file, setProgress);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploading = progress !== null;

  return (
    <div className="grid gap-2">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/10 bg-mist",
          aspect === "wide" ? "aspect-[16/7] max-w-md" : "aspect-square w-32"
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-sm">
            <Loader2Icon className="size-4 animate-spin" /> {progress}%
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon /> {value ? "Replace" : "Upload"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled || uploading} onClick={() => onChange("")}>
            <Trash2Icon /> Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
