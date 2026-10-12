import type { Seller } from "@glamsite/shared/types";

export const STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY = "glamsite-storefront-not-live-modal-dismissed";

export const MAX_RETURN_POLICY_CHARS = 2000;

export type PublishRequirement = "ID document" | "Profile photo";

export function missingPublishRequirements(
  seller: Pick<Seller, "idDocumentUrl" | "profilePhotoUrl"> | null | undefined
): PublishRequirement[] {
  const missing: PublishRequirement[] = [];
  if (!seller?.idDocumentUrl?.trim()) missing.push("ID document");
  if (!seller?.profilePhotoUrl?.trim()) missing.push("Profile photo");
  return missing;
}

export function formatPublishMissingMessage(missing: PublishRequirement[]): string {
  if (missing.length === 0) return "";
  if (missing.length === 1) {
    return `Add your ${missing[0]} before you can publish.`;
  }
  return `Add your ${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]} before you can publish.`;
}
