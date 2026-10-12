"use server";

import { Resend } from "resend";
import { fetchSellerForAuthUser } from "@/lib/seller";
import { escapeHtml } from "@/lib/support";
import {
  formatPublishMissingMessage,
  MAX_RETURN_POLICY_CHARS,
  missingPublishRequirements,
} from "@/lib/verify";
import { getVerificationDocumentUrl } from "@glamsite/shared/id-verification-admin";
import { createClient } from "@glamsite/shared/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Seller } from "@glamsite/shared/types";

type SignedInSeller =
  | { ok: true; supabase: SupabaseClient; seller: Seller }
  | { ok: false; error: string };

function isOwnDocumentPath(path: string, sellerId: string): boolean {
  const prefix = `${sellerId}/`;
  return (
    Boolean(sellerId) &&
    path.startsWith(prefix) &&
    !path.includes("..") &&
    !path.startsWith("/")
  );
}

async function requireSignedInSeller(): Promise<SignedInSeller> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to continue." };

  const seller = await fetchSellerForAuthUser(supabase, user.id);
  if (!seller) return { ok: false, error: "No seller profile is linked to this account." };

  return { ok: true, supabase, seller };
}

/** Signed preview URL for the signed-in seller's own id-verification object. */
export async function createVerificationDocumentPreviewUrl(
  path: string
): Promise<{ url: string } | { error: string }> {
  const objectPath = path.trim();
  if (!objectPath) return { error: "Missing document path." };

  const session = await requireSignedInSeller();
  if (!session.ok) return { error: session.error };

  if (!isOwnDocumentPath(objectPath, session.seller.id)) {
    return { error: "You can only preview your own documents." };
  }

  try {
    const url = await getVerificationDocumentUrl(objectPath);
    return { url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create a preview link.",
    };
  }
}

export async function saveSellerReturnPolicy(
  returnPolicy: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSignedInSeller();
  if (!session.ok) return { error: session.error };

  const cleaned = returnPolicy.trim().slice(0, MAX_RETURN_POLICY_CHARS);
  const { error } = await session.supabase
    .from("sellers")
    .update({ return_policy: cleaned })
    .eq("id", session.seller.id);

  if (error) {
    console.error("Failed to save return policy", error);
    return { error: "Could not save your return policy. Try again." };
  }

  return { ok: true };
}

export async function submitSellerForReview(returnPolicy: string): Promise<
  | { ok: true; submittedAt: number; alreadySubmitted: boolean; notifyWarning?: string }
  | { error: string; missing?: string[] }
> {
  const session = await requireSignedInSeller();
  if (!session.ok) return { error: session.error };

  const { supabase, seller } = session;
  const missing = missingPublishRequirements(seller);
  if (missing.length > 0) {
    return { error: formatPublishMissingMessage(missing), missing };
  }

  const cleanedPolicy = returnPolicy.trim().slice(0, MAX_RETURN_POLICY_CHARS);
  const alreadySubmitted = Boolean(seller.verificationSubmittedAt);
  const submittedAt = Date.now();

  const { error } = await supabase
    .from("sellers")
    .update({
      return_policy: cleanedPolicy,
      verification_submitted_at: new Date(submittedAt).toISOString(),
    })
    .eq("id", seller.id);

  if (error) {
    console.error("Failed to submit seller for review", error);
    return { error: "Could not submit for review. Try again." };
  }

  const notifyWarning = await notifyAdminsSellerReady({
    seller,
    returnPolicy: cleanedPolicy,
    submittedAt,
    alreadySubmitted,
  });

  return {
    ok: true,
    submittedAt,
    alreadySubmitted,
    ...(notifyWarning ? { notifyWarning } : {}),
  };
}

async function notifyAdminsSellerReady(input: {
  seller: Seller;
  returnPolicy: string;
  submittedAt: number;
  alreadySubmitted: boolean;
}): Promise<string | undefined> {
  const seller = input.seller;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;
  if (!apiKey || !fromEmail || !inboxEmail) {
    console.error("Seller review email skipped — Resend env is not configured.");
    return "Submitted, but the review team email is not configured yet. We still recorded that you are ready.";
  }

  const submittedLabel = new Date(input.submittedAt).toISOString();
  const action = input.alreadySubmitted ? "updated their verification" : "is ready for review";
  const html = `
      <div style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.5; color: #0b0e14;">
        <h2 style="margin: 0 0 16px;">Seller ${escapeHtml(action)}</h2>
        <p style="margin: 0;">Business: ${escapeHtml(seller.businessName || "Not set")}</p>
        <p style="margin: 0;">Store: ${escapeHtml(seller.storeSlug || "Not set")}</p>
        <p style="margin: 0;">Email: ${escapeHtml(seller.email || "Not set")}</p>
        <p style="margin: 0;">Phone: ${escapeHtml(seller.phone || "Not set")}</p>
        <p style="margin: 0 0 16px;">Seller ID: ${escapeHtml(seller.id)}</p>
        <hr style="border: none; border-top: 1px solid #e4e1d8; margin: 20px 0;" />
        <p style="margin: 0;">ID document: ${seller.idDocumentUrl ? "uploaded" : "missing"}</p>
        <p style="margin: 0;">Profile photo: ${seller.profilePhotoUrl ? "uploaded" : "missing"}</p>
        <p style="margin: 0;">Business registration: ${
          seller.businessRegistrationUrl ? "uploaded" : "not provided"
        }</p>
        <p style="margin: 0 0 16px;">Submitted at: ${escapeHtml(submittedLabel)}</p>
        <p style="margin: 0 0 8px;"><strong>Return policy</strong></p>
        <p style="white-space: pre-wrap; margin: 0;">${
          input.returnPolicy
            ? escapeHtml(input.returnPolicy)
            : "Not set"
        }</p>
      </div>
    `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: inboxEmail,
      replyTo: seller.email || undefined,
      subject: `[Review] ${input.alreadySubmitted ? "Updated" : "Ready"}: ${seller.businessName || seller.storeSlug}`,
      html,
    });
    if (error) {
      console.error("Failed to send seller review notification", error);
      return "Submitted, but we could not email the review team. Try Publish again or contact support.";
    }
  } catch (err) {
    console.error("Failed to send seller review notification", err);
    return "Submitted, but we could not email the review team. Try Publish again or contact support.";
  }

  return undefined;
}
