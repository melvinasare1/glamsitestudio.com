"use client";

import { createClient } from "./supabase/client";

export const ID_VERIFICATION_BUCKET = "id-verification";
export const MAX_VERIFICATION_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const VERIFICATION_DOCUMENT_ACCEPT = "image/jpeg,image/png,image/webp";

export const VERIFICATION_DOC_TYPES = [
  "id-document",
  "profile-photo",
  "business-registration",
] as const;

export type VerificationDocType = (typeof VERIFICATION_DOC_TYPES)[number];

const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateVerificationDocument(file: File): string | null {
  if (!MIME_TYPES.has(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_VERIFICATION_DOCUMENT_BYTES) {
    return "Files must be 5 MB or smaller.";
  }
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return EXTENSION_BY_MIME[file.type] ?? "jpg";
}

/**
 * Uploads to id-verification/{sellerId}/{docType}-{timestamp}.{ext} with the
 * authenticated browser client. Returns the object path (not a public URL).
 */
export async function uploadVerificationDocument(
  sellerId: string,
  file: File,
  docType: VerificationDocType
): Promise<string> {
  const trimmedId = sellerId.trim();
  if (!trimmedId) throw new Error("Missing seller id.");

  const validationError = validateVerificationDocument(file);
  if (validationError) throw new Error(validationError);

  const objectPath = `${trimmedId}/${docType}-${Date.now()}.${extensionFor(file)}`;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(ID_VERIFICATION_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) throw error;
  return data?.path ?? objectPath;
}
