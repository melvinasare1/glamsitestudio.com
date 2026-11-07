"use server";

import { revalidatePath } from "next/cache";
import { demoSiteData, seedableContent } from "@glamsite/shared/demo";
import { isSectionKey, parseSectionValues } from "@glamsite/shared/site-content";
import { isTemplateId } from "@glamsite/shared/templates";
import { dbError, fail, ownerContext, type ActionResult, type ServerClient } from "@/lib/business";

/** Save one section of the site content. Other sections are left exactly as stored. */
export async function saveSection(sectionKey: string, values: unknown): Promise<ActionResult> {
  if (!isSectionKey(sectionKey)) return fail("Unknown section.");
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const content = { ...ctx.business.content, [sectionKey]: parseSectionValues(sectionKey, values) };
  const { error } = await ctx.supabase.from("businesses").update({ content }).eq("id", ctx.business.id);
  if (error) return dbError("save section", error);

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * True only for a business nobody has touched yet: no content, no services,
 * no staff, no hours. Seeding a template's demo content/services/staff/hours
 * onto anything else would silently overwrite an owner's real work, so this
 * gate has to hold for every one of those, not just content.
 */
async function isUntouched(supabase: ServerClient, businessId: string, content: object): Promise<boolean> {
  if (Object.keys(content).length > 0) return false;
  const [services, staff, hours] = await Promise.all([
    supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("staff").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("opening_hours").select("id", { count: "exact", head: true }).eq("business_id", businessId),
  ]);
  return !services.count && !staff.count && !hours.count;
}

/**
 * Populates a blank site from a template's demo: content copy, example
 * services/categories, staff and opening hours, so picking a template gives
 * an owner a fully-populated starting point to edit instead of a blank one.
 * Only ever called once isUntouched() has confirmed there's nothing to lose.
 */
async function seedFromTemplate(supabase: ServerClient, businessId: string, templateId: string): Promise<void> {
  const demo = demoSiteData(templateId);

  const { error: contentError } = await supabase
    .from("businesses")
    .update({ content: seedableContent(templateId) })
    .eq("id", businessId);
  if (contentError) console.error("[dashboard] seed content failed", businessId, contentError);

  const categoryIdByDemoId = new Map<string, string>();
  for (const category of demo.categories) {
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ business_id: businessId, name: category.name, position: category.position })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[dashboard] seed category failed", businessId, category.name, error);
      continue;
    }
    categoryIdByDemoId.set(category.id, data.id as string);
  }

  if (demo.services.length) {
    const rows = demo.services.map((service) => ({
      business_id: businessId,
      category_id: service.categoryId ? (categoryIdByDemoId.get(service.categoryId) ?? null) : null,
      name: service.name,
      duration_minutes: service.durationMinutes,
      price_cents: service.priceCents,
      price_is_from: service.priceIsFrom,
      position: service.position,
    }));
    const { error } = await supabase.from("services").insert(rows);
    if (error) console.error("[dashboard] seed services failed", businessId, error);
  }

  if (demo.staff.length) {
    const rows = demo.staff.map((person) => ({
      business_id: businessId,
      name: person.name,
      role: person.role,
      bio: person.bio,
      position: person.position,
    }));
    const { error } = await supabase.from("staff").insert(rows);
    if (error) console.error("[dashboard] seed staff failed", businessId, error);
  }

  if (demo.hours.length) {
    const rows = demo.hours.map((hour) => ({
      business_id: businessId,
      weekday: hour.weekday,
      opens_at: hour.opensAt,
      closes_at: hour.closesAt,
    }));
    const { error } = await supabase.from("opening_hours").insert(rows);
    if (error) console.error("[dashboard] seed hours failed", businessId, error);
  }
}

/**
 * Switching template never touches existing content -- but a business
 * nobody has entered anything into yet (isUntouched) gets seeded from that
 * template's demo first, so the owner lands on a fully-populated site
 * instead of a blank one with just a new layout.
 */
export type SaveTemplateResult = { ok: true; seeded: boolean } | { ok: false; error: string };

export async function saveTemplate(templateId: string): Promise<SaveTemplateResult> {
  if (!isTemplateId(templateId)) return { ok: false, error: "Unknown template." };
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { error } = await ctx.supabase
    .from("businesses")
    .update({ template_id: templateId })
    .eq("id", ctx.business.id);
  if (error) {
    dbError("save template", error);
    return { ok: false, error: "Something went wrong saving that. Please try again." };
  }

  const seeded = await isUntouched(ctx.supabase, ctx.business.id, ctx.business.content);
  if (seeded) await seedFromTemplate(ctx.supabase, ctx.business.id, templateId);

  revalidatePath("/", "layout");
  return { ok: true, seeded };
}
