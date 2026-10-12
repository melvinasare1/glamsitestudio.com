"use server";

import { faqsFromUnknown } from "@glamsite/shared/mappers";
import { fetchSellerForAuthUser } from "@/lib/seller";
import { createClient } from "@glamsite/shared/supabase/server";
import type { StoreFaq } from "@glamsite/shared/types";

export async function saveSellerFaqs(
  faqs: StoreFaq[]
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to continue." };

  const seller = await fetchSellerForAuthUser(supabase, user.id);
  if (!seller) return { error: "No seller profile is linked to this account." };

  const cleaned = faqsFromUnknown(faqs).slice(0, 20).map((item) => ({
    question: item.question.slice(0, 200),
    answer: item.answer.slice(0, 1000),
  }));

  const { error } = await supabase
    .from("sellers")
    .update({ faqs: cleaned })
    .eq("id", seller.id);

  if (error) {
    console.error("Failed to save seller FAQs", error);
    return { error: "Could not save FAQs. Try again." };
  }

  return { ok: true };
}
