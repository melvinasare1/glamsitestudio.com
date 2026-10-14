"use server";

import { revalidatePath } from "next/cache";
import { isSectionKey, parseSectionValues } from "@glamsite/shared/site-content";
import { isTemplateId } from "@glamsite/shared/templates";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

/** Save one section of the site content. Other sections are left exactly as stored. */
export async function saveSection(sectionKey: string, values: unknown): Promise<ActionResult> {
  if (!isSectionKey(sectionKey)) return fail("Unknown section.");
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const content = { ...ctx.business.content, [sectionKey]: parseSectionValues(sectionKey, values) };
  const { error } = await ctx.supabase.from("businesses").update({ content }).eq("id", ctx.business.id);
  if (error) return dbError("save section", error);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveTemplate(templateId: string): Promise<ActionResult> {
  if (!isTemplateId(templateId)) return fail("Unknown template.");
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { error } = await ctx.supabase
    .from("businesses")
    .update({ template_id: templateId })
    .eq("id", ctx.business.id);
  if (error) return dbError("save template", error);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
