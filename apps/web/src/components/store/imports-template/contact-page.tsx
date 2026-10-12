import { MessageCircle } from "lucide-react";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { ImportsContactForm } from "@/components/store/imports-template/contact-form";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { CONTACT_WHATSAPP_GREETING, whatsappHref } from "@/lib/contact";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

const PLACEHOLDER_PHONE = "+233 55 000 0000";

function withBrand(text: string, brandName: string) {
  return text.replaceAll("{brandName}", brandName);
}

export async function ImportsContactPage({
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
      "Questions about an order, stock, or delivery? Send {brandName} a message or reach us on WhatsApp."
    ),
    brandName
  );
  const formHeading = storefrontContentValue(content, "contactFormHeading", "Send a message");
  const formIntro = storefrontContentValue(
    content,
    "contactFormIntro",
    "Tell us what you need and we will get back to you as soon as we can."
  );
  const waHeading = storefrontContentValue(content, "contactWhatsappHeading", "Call or WhatsApp");
  const waBody = withBrand(
    storefrontContentValue(
      content,
      "contactWhatsappBody",
      "Prefer to chat? Message {brandName} on WhatsApp with your order or question."
    ),
    brandName
  );

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "imports-template"} path={path} />
      <section className="bg-[#1266b5] text-white">
        <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-semibold tracking-widest text-white/80 uppercase">{kicker}</p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{headline}</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90">{subtext}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[90rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#1a1f2b]">{formHeading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#66707e]">{formIntro}</p>
          <div className="mt-8">
            <ImportsContactForm storeSlug={storeSlug ?? ""} />
          </div>
        </div>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open WhatsApp chat at ${phone}`}
          className="block rounded-2xl bg-[#1266b5] px-8 py-10 text-white transition-colors hover:bg-[#0d4c88] md:px-10 md:py-12"
        >
          <h2 className="text-xl font-semibold tracking-tight">{waHeading}</h2>
          <p className="mt-3 text-base leading-relaxed text-white/90">{waBody}</p>
          <p className="mt-6 text-lg font-semibold tracking-wide">{phone}</p>
          <span className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-[#1266b5]">
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp us
          </span>
        </a>
      </section>
    </div>
  );
}
