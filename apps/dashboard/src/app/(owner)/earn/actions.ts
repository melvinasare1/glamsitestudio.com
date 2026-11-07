"use server";

import { revalidatePath } from "next/cache";
import { platformReferralStaffNotifyEmail, sendEmail } from "@glamsite/shared/email";
import type { PlatformReferralPayoutMethod } from "@glamsite/shared/types";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const done = (): ActionResult => {
  revalidatePath("/earn");
  return { ok: true };
};

/**
 * Submits a new "Earn" referral: another business this owner wants to refer
 * to Glam Site Studios. Staff take it from here (see admin/earn) -- an
 * owner can only create and view their own, never change its status.
 */
export async function submitPlatformReferral(input: {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const businessName = input.businessName.trim();
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim();
  const contactPhone = input.contactPhone.trim();

  if (!businessName) return fail("Enter the business's name.");
  if (!contactName) return fail("Enter a contact name.");
  if (!EMAIL_PATTERN.test(contactEmail)) return fail("Enter a valid email address.");

  const { error } = await supabase.from("platform_referrals").insert({
    referrer_business_id: business.id,
    referred_business_name: businessName,
    referred_contact_name: contactName,
    referred_contact_email: contactEmail,
    referred_contact_phone: contactPhone,
  });
  if (error) return dbError("submit platform referral", error);

  const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;
  if (inboxEmail) {
    const rendered = platformReferralStaffNotifyEmail({
      referrerBusinessName: business.name || business.slug,
      referredBusinessName: businessName,
      contactName,
      contactEmail,
      contactPhone,
    });
    await sendEmail({ to: inboxEmail, replyTo: contactEmail, ...rendered });
  }

  return done();
}

/** Where we send this business's Earn commission. Owner-managed. */
export async function setPlatformReferralPayoutDetails(input: {
  method: PlatformReferralPayoutMethod;
  accountName: string;
  identifier: string;
  identifier2: string;
  notes: string;
}): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const { error } = await supabase.from("platform_referral_payout_details").upsert({
    business_id: business.id,
    method: input.method,
    account_name: input.accountName.trim(),
    identifier: input.identifier.trim(),
    identifier_2: input.identifier2.trim(),
    notes: input.notes.trim(),
  });
  if (error) return dbError("set platform referral payout details", error);
  return done();
}
