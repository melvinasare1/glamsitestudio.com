import { createAdminClient } from "./supabase/admin";

export const ID_VERIFICATION_BUCKET = "id-verification";

/** Short-lived so a leaked URL cannot be reused for long. */
export const VERIFICATION_SIGNED_URL_TTL_SECONDS = 5 * 60;

/**
 * Creates a short-lived signed URL for a private id-verification object.
 * Service-role only — never import this module from a Client Component.
 */
export async function getVerificationDocumentUrl(path: string): Promise<string> {
  const objectPath = path.trim();
  if (!objectPath) throw new Error("Missing document path.");

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(ID_VERIFICATION_BUCKET)
    .createSignedUrl(objectPath, VERIFICATION_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create a signed URL.");
  }
  return data.signedUrl;
}
