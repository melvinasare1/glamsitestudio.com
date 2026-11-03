"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

export type ClientInput = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

/** Creates a client when `id` is unset, otherwise updates that client. */
export async function saveClient(input: ClientInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const name = input.name.trim();
  if (!name) return fail("Enter a name.");
  if (name.length > 120) return fail("Name is too long.");

  const row = {
    business_id: business.id,
    name,
    email: input.email.trim(),
    phone: input.phone.trim(),
    notes: input.notes.trim().slice(0, 2000),
  };

  const { error } = input.id
    ? await supabase.from("clients").update(row).eq("id", input.id).eq("business_id", business.id)
    : await supabase.from("clients").insert(row);

  if (error) {
    if (error.code === "23505") return fail("You already have a client with that email.");
    return dbError("save client", error);
  }
  revalidatePath("/customers");
  return { ok: true };
}
