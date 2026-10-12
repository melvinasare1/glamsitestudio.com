import { MessageCircle } from "lucide-react";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { CONTACT_WHATSAPP_GREETING, whatsappHref } from "@/lib/contact";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

const PLACEHOLDER_PHONE = "+233 55 000 0000";

function withBrand(text: string, brandName: string) {
  return text.replaceAll("{brandName}", brandName);
}

export async function HairContactPage({
  storeSlug,
  path,
}: {
  storeSlug?: string;
  path: string;
}) {
  const seller = storeSlug ? await getStorefrontSellerBySlug(storeSlug) : null;
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const content = seller?.storeContent;
  const sellerPhone = seller?.phone?.trim() ?? "";
  const phone = sellerPhone || PLACEHOLDER_PHONE;
  const wa = whatsappHref(phone, CONTACT_WHATSAPP_GREETING) ?? "https://wa.me/233550000000";

  const kicker = storefrontContentValue(content, "contactKicker", "Get in touch");
  const headline = storefrontContentValue(content, "contactHeadline", "Contact us");
  const subtext = withBrand(
    storefrontContentValue(
      content,
      "contactSubtext",
      "Questions about an order, length, or texture? Message {brandName} on WhatsApp."
    ),
    brandName
  );
  const waHeading = storefrontContentValue(content, "contactWhatsappHeading", "WhatsApp");
  const waBody = withBrand(
    storefrontContentValue(
      content,
      "contactWhatsappBody",
      "Prefer to chat? Message {brandName} with your order or hair question."
    ),
    brandName
  );

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "hair-beauty-template"} path={path} />
      <section className="bg-[#8a8165] text-[#f7f1df]">
        <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-semibold tracking-widest text-[#f7f1df]/80 uppercase">{kicker}</p>
          <h1
            className="mt-3 max-w-xl text-3xl font-medium tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
          >
            {headline}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#f7f1df]/90">{subtext}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open WhatsApp chat at ${phone}`}
          className="block max-w-xl rounded-2xl border border-[#d9cfc3] bg-[#f7f1df] px-8 py-10 text-[#4f4a3d] transition-colors hover:border-[#c4b896] md:px-10 md:py-12"
        >
          <h2
            className="text-xl font-medium tracking-tight"
            style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
          >
            {waHeading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#4f4a3d]/70">{waBody}</p>
          <p className="mt-6 text-lg font-semibold tracking-wide">{phone}</p>
          <span className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#8a8165] px-6 py-3 text-sm font-medium text-[#f7f1df]">
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp us
          </span>
        </a>
      </section>
    </div>
  );
}
