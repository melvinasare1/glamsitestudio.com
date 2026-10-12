import Image from "next/image";
import Link from "next/link";
import { MessageCircle, PackageCheck, Truck } from "lucide-react";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { HomeCatalogue } from "@/components/store/imports-template/HomeCatalogue";
import { listImportsProducts } from "@/components/store/imports-template/catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { storefrontBase } from "@/lib/store-path";

const DEFAULT_HEADLINE = "Quality imports, delivered to your door";
const DEFAULT_SUBTEXT =
  "Everyday imported goods for Ghanaian homes. Browse the catalogue, add what you need, and pay by Mobile Money.";

const TRUST = [
  {
    title: "Quality imported goods",
    description: "Drinks, frozen treats, sun care, and more — selected for everyday use.",
    icon: PackageCheck,
  },
  {
    title: "Pay with Mobile Money",
    description: "Checkout on the site, then send MoMo to the seller. No card is charged here.",
    icon: MessageCircle,
  },
  {
    title: "Delivery to your door",
    description: "Accra usually next day. Other regions typically arrive a few days after dispatch.",
    icon: Truck,
  },
] as const;

export async function ImportsHome({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("imports-template", storeSlug);
  const seller = storeSlug ? await getStorefrontSellerBySlug(storeSlug) : null;
  const heroHeadline = storefrontContentValue(seller?.storeContent, "heroHeadline", DEFAULT_HEADLINE);
  const heroSubtext = storefrontContentValue(seller?.storeContent, "heroSubtext", DEFAULT_SUBTEXT);
  const heroImageUrl = storefrontContentValue(seller?.storeContent, "heroImageUrl");
  const products = await listImportsProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "imports-template"} path={base} />

      <section className="relative">
        <div className="relative min-h-[28rem] overflow-hidden bg-[#1266b5] bg-[radial-gradient(circle_at_top_right,rgba(240,145,58,0.28),transparent_55%)] sm:min-h-[30rem]">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : null}
          {heroImageUrl ? (
            <div className="absolute inset-0 bg-[#0d4c88]/55" />
          ) : null}
          <div className="relative mx-auto flex min-h-[28rem] max-w-[90rem] flex-col items-center justify-center px-4 pb-28 pt-12 text-center sm:min-h-[30rem] sm:px-6 sm:pb-32 lg:px-8">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {heroHeadline}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {heroSubtext}
            </p>
            <Link
              href={`${base}/search`}
              className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-medium text-[#1266b5] hover:bg-[#e8f1fa]"
            >
              Browse products
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[90rem] -mt-14 px-4 sm:-mt-16 sm:px-6 lg:px-8">
          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {TRUST.map((card) => (
              <li
                key={card.title}
                className="rounded-lg border border-[#e4e8ef] bg-white p-4 shadow-sm sm:p-5"
              >
                <card.icon className="size-6 text-[#1266b5]" aria-hidden />
                <p className="mt-3 font-semibold text-[#1a1f2b]">{card.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#66707e]">{card.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
        <HomeCatalogue products={products} productBase={base} />
      </div>
    </div>
  );
}
