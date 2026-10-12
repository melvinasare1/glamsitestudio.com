"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { billingPeriodLabel } from "@/lib/trial";

export type MarkPaidResult = { ok: true } | { ok: false; error: string };

export async function markSellerSubscriptionPaid(sellerId: string): Promise<MarkPaidResult> {
  const admin = await requireAdmin();
  const id = sellerId.trim();
  if (!id) return { ok: false, error: "Missing seller id." };

  try {
    const supabase = createAdminClient();
    const { data: seller, error: loadError } = await supabase
      .from("sellers")
      .select("id, business_name, base_fee_cedis, subscription_status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) return { ok: false, error: loadError.message };
    if (!seller) return { ok: false, error: "Seller not found." };
    if (seller.subscription_status === "active") {
      return { ok: false, error: "This seller is already marked as paid." };
    }

    const amount = Number(seller.base_fee_cedis ?? 0);
    const confirmedAt = new Date().toISOString();
    const periodLabel = billingPeriodLabel(Date.parse(confirmedAt));

    const { error: paymentError } = await supabase.from("billing_payments").insert({
      seller_id: id,
      amount_cedis: amount,
      confirmed_by: admin.email,
      confirmed_at: confirmedAt,
      period_label: periodLabel,
    });
    if (paymentError) return { ok: false, error: paymentError.message };

    const { error: updateError } = await supabase
      .from("sellers")
      .update({
        subscription_status: "active",
        last_payment_confirmed_at: confirmedAt,
      })
      .eq("id", id);
    if (updateError) return { ok: false, error: updateError.message };

    revalidatePath("/dashboard/admin/billing");
    revalidatePath("/dashboard/admin/overview");
    return { ok: true };
  } catch (err) {
    console.error("markSellerSubscriptionPaid failed", err);
    return { ok: false, error: "Could not mark payment. Check service role config." };
  }
}
