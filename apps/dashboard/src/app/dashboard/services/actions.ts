"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { moveRow, parsePrice } from "@/lib/order";

export type ServiceInput = {
  id?: string;
  categoryId: string | null;
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  priceIsFrom: boolean;
  bufferMinutes: number;
  isVisible: boolean;
  isBookable: boolean;
};

const done = (): ActionResult => {
  revalidatePath("/dashboard/services");
  return { ok: true };
};

export async function saveService(input: ServiceInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const name = input.name.trim().slice(0, 120);
  if (!name) return fail("Give the service a name.");
  const duration = Math.round(Number(input.durationMinutes));
  if (!Number.isFinite(duration) || duration < 5 || duration > 720) return fail("Choose a duration.");
  const buffer = Math.round(Number(input.bufferMinutes) || 0);
  if (buffer < 0 || buffer > 240) return fail("Clean-up time must be under 4 hours.");
  const price = parsePrice(input.price);
  if (!price.ok) return fail("Enter the price as a number, like 45 or 45.50.");

  const row = {
    category_id: input.categoryId || null,
    name,
    description: input.description.trim().slice(0, 600),
    duration_minutes: duration,
    price_cents: price.cents,
    price_is_from: price.cents != null && input.priceIsFrom,
    buffer_minutes: buffer,
    is_visible: input.isVisible,
    is_bookable: input.isBookable,
  };

  if (input.id) {
    const { error } = await ctx.supabase.from("services").update(row).eq("id", input.id).eq("business_id", ctx.business.id);
    return error ? dbError("update service", error) : done();
  }

  const { count } = await ctx.supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("business_id", ctx.business.id);
  const { error } = await ctx.supabase
    .from("services")
    .insert({ ...row, business_id: ctx.business.id, position: count ?? 0 });
  return error ? dbError("insert service", error) : done();
}

export async function deleteService(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("services").delete().eq("id", id).eq("business_id", ctx.business.id);
  return error ? dbError("delete service", error) : done();
}

export async function moveService(id: string, delta: -1 | 1): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { data: service } = await ctx.supabase
    .from("services")
    .select("category_id")
    .eq("id", id)
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!service) return fail("That service no longer exists.");

  let query = ctx.supabase.from("services").select("id").eq("business_id", ctx.business.id);
  query = service.category_id ? query.eq("category_id", service.category_id) : query.is("category_id", null);
  const { data: rows, error: listError } = await query.order("position").order("name");
  if (listError) return dbError("list services", listError);

  const { error } = await moveRow(ctx.supabase, "services", rows ?? [], id, delta);
  return error ? dbError("move service", error) : done();
}

export async function saveCategory(input: { id?: string; name: string }): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const name = input.name.trim().slice(0, 80);
  if (!name) return fail("Give the category a name.");

  if (input.id) {
    const { error } = await ctx.supabase
      .from("service_categories")
      .update({ name })
      .eq("id", input.id)
      .eq("business_id", ctx.business.id);
    if (error?.code === "23505") return fail("You already have a category with that name.");
    return error ? dbError("rename category", error) : done();
  }

  const { count } = await ctx.supabase
    .from("service_categories")
    .select("id", { count: "exact", head: true })
    .eq("business_id", ctx.business.id);
  const { error } = await ctx.supabase
    .from("service_categories")
    .insert({ business_id: ctx.business.id, name, position: count ?? 0 });
  if (error?.code === "23505") return fail("You already have a category with that name.");
  return error ? dbError("insert category", error) : done();
}

/** Services in the category are kept and become uncategorised. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("service_categories")
    .delete()
    .eq("id", id)
    .eq("business_id", ctx.business.id);
  return error ? dbError("delete category", error) : done();
}

export async function moveCategory(id: string, delta: -1 | 1): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { data: rows, error: listError } = await ctx.supabase
    .from("service_categories")
    .select("id")
    .eq("business_id", ctx.business.id)
    .order("position")
    .order("name");
  if (listError) return dbError("list categories", listError);
  const { error } = await moveRow(ctx.supabase, "service_categories", rows ?? [], id, delta);
  return error ? dbError("move category", error) : done();
}
