import { MessageCircle } from "lucide-react";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import { createClient } from "@glamsite/shared/supabase/server";
import type { StorefrontContent } from "@glamsite/shared/storefront-content-schema";
import { RideContactForm } from "@/components/store/motorbike-template/contact-form";
import {
  interpolateBrand,
  rideText,
} from "@/components/store/motorbike-template/ride-content";
import {
  CONTACT_WHATSAPP_GREETING,
  whatsappHref,
} from "@/lib/contact";
import { getSellerByStoreSlug } from "@/lib/storefront";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";

const ORANGE = "#E8622C";
const PLACEHOLDER_PHONE = "+233 55 000 0000";

async function loadSellerContact(storeSlug: string) {
  if (!storeSlug || !isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    return getSellerByStoreSlug(supabase, storeSlug);
  } catch (err) {
    console.error("Failed to load seller for contact page", err);
    return null;
  }
}

export async function RideContactPage({
  storeSlug,
  path,
}: {
  storeSlug: string;
  path: string;
}) {
  const seller = await loadSellerContact(storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const content: StorefrontContent = seller?.storeContent ?? {};
  const sellerPhone = seller?.phone?.trim() ?? "";
  const phone = sellerPhone || PLACEHOLDER_PHONE;
  const wa =
    whatsappHref(phone, CONTACT_WHATSAPP_GREETING) ?? "https://wa.me/233550000000";

  return (
    <div className="bg-[#FFFFFF]">
      <StorefrontTracker storeSlug={storeSlug || "motorbike-template"} path={path} />
      <section className="bg-[#141414] text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
            {rideText(content, "contactKicker")}
          </p>
          <h1
            className="mt-3 max-w-xl text-[36px] font-extrabold leading-[1.05] tracking-tight md:text-[48px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {rideText(content, "contactHeadline")}
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/65">
            {interpolateBrand(rideText(content, "contactSubtext"), brandName)}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-14 md:px-10 md:py-20">
        <div>
          <h2
            className="text-[24px] font-extrabold tracking-tight text-[#141414]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {rideText(content, "contactFormHeading")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#141414]/50">
            {rideText(content, "contactFormIntro")}
          </p>
          <div className="mt-8">
            <RideContactForm storeSlug={storeSlug} />
          </div>
        </div>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open WhatsApp chat at ${phone}`}
          className="block rounded-[28px] bg-[#141414] px-8 py-10 text-white transition-opacity hover:opacity-95 md:px-10 md:py-12"
        >
          <h2
            className="text-[22px] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {rideText(content, "contactWhatsappHeading")}
          </h2>
          <p className="mt-3 text-[16px] font-medium leading-relaxed text-white/80 md:text-[17px]">
            {interpolateBrand(rideText(content, "contactWhatsappBody"), brandName)}
          </p>
          <p className="mt-6 text-[20px] font-semibold tracking-wide md:text-[22px]">{phone}</p>
          <span
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: ORANGE }}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp us
          </span>
        </a>
      </section>
    </div>
  );
}
