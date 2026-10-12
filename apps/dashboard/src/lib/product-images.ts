import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@glamsite/shared/supabase/env";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGES = 12;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const PRODUCT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateProductImage(file: File): string | null {
  if (!PRODUCT_IMAGE_MIME_TYPES.has(file.type)) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return EXTENSION_BY_MIME[file.type] ?? "jpg";
}

function encodeObjectPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function messageFromUploadResponse(status: number, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const record = payload as { message?: unknown; error?: unknown };
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
  }
  if (status === 413) return "That image is too large to upload.";
  if (status === 401 || status === 403) {
    return "You do not have permission to upload to this store.";
  }
  return `Upload failed (${status}).`;
}

async function uploadViaClient(
  supabase: SupabaseClient,
  objectPath: string,
  file: File
) {
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
}

/**
 * Uploads one image to product-images/{sellerId}/… and returns its public URL.
 * Reports 0–100 upload progress via onProgress.
 */
export async function uploadProductImage(
  supabase: SupabaseClient,
  sellerId: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const validationError = validateProductImage(file);
  if (validationError) throw new Error(validationError);

  const objectPath = `${sellerId}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (session?.access_token && supabaseUrl && anonKey) {
    try {
      await uploadViaXhr({
        objectPath,
        file,
        accessToken: session.access_token,
        supabaseUrl,
        anonKey,
        onProgress,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "NETWORK") throw err;
      onProgress(10);
      await uploadViaClient(supabase, objectPath, file);
      onProgress(100);
    }
  } else {
    onProgress(10);
    await uploadViaClient(supabase, objectPath, file);
    onProgress(100);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);
  if (!data.publicUrl) {
    throw new Error("Upload succeeded but the public URL could not be created.");
  }
  return data.publicUrl;
}

function uploadViaXhr(input: {
  objectPath: string;
  file: File;
  accessToken: string;
  supabaseUrl: string;
  anonKey: string;
  onProgress: (percent: number) => void;
}): Promise<void> {
  const endpoint = `${input.supabaseUrl}/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${encodeObjectPath(
    input.objectPath
  )}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.responseType = "json";
    xhr.setRequestHeader("Authorization", `Bearer ${input.accessToken}`);
    xhr.setRequestHeader("apikey", input.anonKey);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress(Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(100);
        resolve();
        return;
      }
      reject(new Error(messageFromUploadResponse(xhr.status, xhr.response)));
    };
    xhr.onerror = () => reject(new Error("NETWORK"));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));

    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", input.file);
    input.onProgress(0);
    xhr.send(body);
  });
}
