"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { moveRow } from "@/lib/order";

export type StaffInput = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  isVisible: boolean;
  isBookable: boolean;
  serviceIds: string[];
};

const done = (): ActionResult => {
  revalidatePath("/dashboard/team");
  return { ok: true };
};

export async function saveStaff(input: StaffInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const name = input.name.trim().slice(0, 80);
  if (!name) return fail("Add their name.");
  const photoUrl = input.photoUrl.trim();
  if (photoUrl && !photoUrl.startsWith("https://")) return fail("That photo link isn't valid.");

  const row = {
    name,
    role: input.role.trim().slice(0, 80),
    bio: input.bio.trim().slice(0, 600),
    photo_url: photoUrl,
    is_visible: input.isVisible,
    is_bookable: input.isBookable,
  };

  let staffId = input.id;
  if (staffId) {
    const { error } = await supabase.from("staff").update(row).eq("id", staffId).eq("business_id", business.id);
    if (error) return dbError("update staff", error);
  } else {
    const { count } = await supabase
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);
    const { data, error } = await supabase
      .from("staff")
      .insert({ ...row, business_id: business.id, position: count ?? 0 })
      .select("id")
      .single();
    if (error || !data) return dbError("insert staff", error);
    staffId = data.id as string;
  }

  // Sync which services they do. The composite foreign keys reject services from another business.
  const wanted = new Set(input.serviceIds);
  const { data: links, error: linksError } = await supabase
    .from("staff_services")
    .select("service_id")
    .eq("staff_id", staffId)
    .eq("business_id", business.id);
  if (linksError) return dbError("list staff services", linksError);

  const current = new Set((links ?? []).map((link) => link.service_id as string));
  const toRemove = [...current].filter((id) => !wanted.has(id));
  const toAdd = [...wanted].filter((id) => !current.has(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from("staff_services")
      .delete()
      .eq("staff_id", staffId)
      .eq("business_id", business.id)
      .in("service_id", toRemove);
    if (error) return dbError("remove staff services", error);
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("staff_services")
      .insert(toAdd.map((serviceId) => ({ business_id: business.id, staff_id: staffId, service_id: serviceId })));
    if (error) return dbError("add staff services", error);
  }

  return done();
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("staff").delete().eq("id", id).eq("business_id", ctx.business.id);
  return error ? dbError("delete staff", error) : done();
}

export async function moveStaff(id: string, delta: -1 | 1): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { data: rows, error: listError } = await ctx.supabase
    .from("staff")
    .select("id")
    .eq("business_id", ctx.business.id)
    .order("position")
    .order("name");
  if (listError) return dbError("list staff", listError);
  const { error } = await moveRow(ctx.supabase, "staff", rows ?? [], id, delta);
  return error ? dbError("move staff", error) : done();
}
