"use server";

import { revalidatePath } from "next/cache";
import { CURRENCIES } from "@glamsite/shared/format";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { COUNTRIES, TIMEZONES } from "./options";

export type DetailsInput = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
  timezone: string;
  currency: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (value: string, max: number) => value.trim().slice(0, max);

export async function saveDetails(input: DetailsInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const name = clip(input.name, 120);
  if (!name) return fail("Add your business name.");
  const email = clip(input.email, 254).toLowerCase();
  if (email && !EMAIL.test(email)) return fail("That email address doesn't look right.");
  if (!COUNTRIES.some((item) => item.code === input.country)) return fail("Choose a country.");
  if (!TIMEZONES.some((item) => item.value === input.timezone)) return fail("Choose a time zone.");
  if (!CURRENCIES.some((item) => item.code === input.currency)) return fail("Choose a currency.");

  const { error } = await ctx.supabase
    .from("businesses")
    .update({
      name,
      email,
      phone: clip(input.phone, 40),
      address_line1: clip(input.line1, 120),
      address_line2: clip(input.line2, 120),
      city: clip(input.city, 80),
      postcode: clip(input.postcode, 20).toUpperCase(),
      country: input.country,
      timezone: input.timezone,
      currency: input.currency,
    })
    .eq("id", ctx.business.id);
  if (error) return dbError("save details", error);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
