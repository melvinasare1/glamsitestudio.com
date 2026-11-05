"use server";

import { revalidatePath } from "next/cache";
import { dbError, ownerContext, type ActionResult } from "@/lib/business";

export type PoliciesInput = {
  policiesText: string;
  termsText: string;
};

const MAX_LENGTH = 20000;
const clip = (value: string) => value.trim().slice(0, MAX_LENGTH);
const nullable = (value: string) => (value ? value : null);

export async function savePolicies(input: PoliciesInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { error } = await ctx.supabase
    .from("businesses")
    .update({
      policies_text: nullable(clip(input.policiesText)),
      terms_text: nullable(clip(input.termsText)),
    })
    .eq("id", ctx.business.id);
  if (error) return dbError("save policies", error);

  revalidatePath("/settings/policies");
  return { ok: true };
}
