import Image from "next/image";
import Link from "next/link";
import { CollectionGrid } from "@/components/store/sneaker-template/CollectionGrid";
import { listSneakerProducts } from "@/components/store/sneaker-template/catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { storefrontBase } from "@/lib/store-path";
import { sneakerSearchAllHref } from "@/components/store/sneaker-template/demo-catalog";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";

const DEFAULT_HERO_IMAGE = "/store/sneaker-template/hero.png";
const DEFAULT_HEADLINE = "Sneakers That Defy Your Everyday Look";
const DEFAULT_SUBTEXT =
  "Warm-toned lifestyle photography from the seller goes here. Until then, this is a placeholder for the homepage hero.";

const PROMOS = [
  {
    title: "Signature top choice with the best look on the street, and always in style.",
    cta: "Shop Now",
    href: (base: string) => `${base}/search?category=${encodeURIComponent("Women")}`,
    image: "/store/sneaker-template/promo-1.png",
    variant: "primary" as const,
  },
  {
    title: "Fresh drops from leading brands that boost confidence with every step.",
    cta: "Shop Now",
    href: (base: string) => `${base}/search?category=${encodeURIComponent("Men")}`,
    image: "/store/sneaker-template/promo-2.png",
    variant: "primary" as const,
  },
  {
    title: "Style stack",
    cta: "View More",
    href: (base: string) => sneakerSearchAllHref(base),
    image: "/store/sneaker-template/promo-3.png",
    variant: "secondary" as const,
  },
];

const COLLAGE = [
  {
    title: "Sneakers",
    image: "/store/sneaker-template/promo-3.png",
    category: "Women",
    span: true,
  },
  {
    title: "Sneakers",
    image: "/store/sneaker-template/promo-1.png",
    category: "Men",
    span: false,
  },
  {
    title: "Featured",
    image: "/store/sneaker-template/promo-2.png",
    category: "Kids",
    span: false,
  },
] as const;

export async function SneakerHome({ storeSlug }: { storeSlug?: string } = {}) {
  const path = storefrontBase("sneaker-template", storeSlug);
  const [seller, products] = await Promise.all([
    storeSlug ? getStorefrontSellerBySlug(storeSlug) : Promise.resolve(null),
    listSneakerProducts(storeSlug),
  ]);
  const heroHeadline = storefrontContentValue(seller?.storeContent, "heroHeadline", DEFAULT_HEADLINE);
  const heroSubtext = storefrontContentValue(seller?.storeContent, "heroSubtext", DEFAULT_SUBTEXT);
  const heroImageUrl = storefrontContentValue(seller?.storeContent, "heroImageUrl", DEFAULT_HERO_IMAGE);
  const newest = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  const summer = [...newest].reverse();

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "sneaker-template"} path={path} />

      <section className="relative min-h-[72vh] overflow-hidden bg-[#E8E2D9] sm:min-h-[78vh]">
        {/* Placeholder photography — replace with the seller's lifestyle shots. */}
        <Image
          src={heroImageUrl || DEFAULT_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A1C14]/55 via-[#2A1C14]/25 to-transparent" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-center px-5 py-16 sm:min-h-[78vh] sm:px-8 lg:px-12">
          <h1
            className="max-w-xl text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[56px] lg:text-[64px]"
            style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
          >
            {heroHeadline}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/85">{heroSubtext}</p>
          <Link
            href={`${path}/search`}
            className="mt-8 inline-flex h-12 w-fit items-center justify-center rounded-full bg-[#F5F0EA] px-8 text-sm font-semibold text-[#2A1C14] transition hover:bg-white"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-3 lg:px-10">
        {PROMOS.map((promo) => (
          <article key={promo.title} className="relative min-h-[28rem] overflow-hidden rounded-[28px] bg-[#E8E2D9]">
            <Image
              src={promo.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 32vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A1C14]/75 via-[#2A1C14]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 sm:p-8">
              <p
                className="max-w-xs text-[22px] font-semibold leading-tight text-white sm:text-[24px]"
                style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
              >
                {promo.title}
              </p>
              <Link
                href={promo.href(path)}
                className={
                  promo.variant === "secondary"
                    ? "inline-flex h-11 items-center justify-center rounded-full bg-[#F5F0EA] px-6 text-sm font-semibold text-[#2A1C14] transition hover:bg-white"
                    : "inline-flex h-11 items-center justify-center rounded-full bg-[#3C2415] px-6 text-sm font-semibold text-white transition hover:opacity-90"
                }
              >
                {promo.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <CollectionGrid
        heading="Newly Dropped Collections"
        subheading="Fresh pairs from this shop — newest first, ready to add to cart."
        products={newest}
        base={path}
        moreHref={`${path}/search`}
      />

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-[32px] font-semibold leading-tight text-[#2A1C14] sm:text-[40px]"
            style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
          >
            Most Recommended Collections For You
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#2A1C14]/60">
            Browse by look — lifestyle shots are placeholders until the seller adds their own photography.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:grid-rows-2 lg:h-[36rem]">
          {COLLAGE.map((tile) => (
            <Link
              key={`${tile.title}-${tile.image}`}
              href={sneakerSearchAllHref(path)}
              className={`relative min-h-[16rem] overflow-hidden rounded-[28px] bg-[#E8E2D9] ${
                tile.span ? "lg:row-span-2 lg:min-h-0" : ""
              }`}
            >
              <Image
                src={tile.image}
                alt=""
                fill
                sizes={tile.span ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1C14]/70 via-[#2A1C14]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 sm:p-8">
                <p
                  className="text-[22px] font-semibold text-white"
                  style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
                >
                  {tile.title}
                </p>
                <span className="inline-flex h-11 items-center justify-center rounded-full bg-[#F5F0EA] px-5 text-sm font-semibold text-[#2A1C14]">
                  View all sneakers
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <Link
          href={`${path}/search`}
          className="relative flex min-h-[18rem] overflow-hidden rounded-[28px] bg-[#E8E2D9] sm:min-h-[22rem]"
        >
          <Image
            src="/store/sneaker-template/trending.png"
            alt=""
            fill
            sizes="(min-width: 1440px) 1440px, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#2A1C14]/40" />
          <div className="relative flex w-full flex-col items-center justify-center gap-5 px-6 py-16 text-center">
            <h2
              className="text-[36px] font-semibold text-white sm:text-[48px]"
              style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
            >
              Trending Now
            </h2>
            <span className="inline-flex h-12 items-center justify-center rounded-full bg-[#F5F0EA] px-8 text-sm font-semibold text-[#2A1C14]">
              Explore Shop
            </span>
          </div>
        </Link>
      </section>

      <CollectionGrid
        heading="Summer Collections"
        subheading="Warm-weather pairs and extras from the same catalogue — a second look at what this shop is selling."
        products={summer}
        base={path}
        moreHref={`${path}/search`}
      />

      <section className="relative min-h-[22rem] overflow-hidden bg-[#E8E2D9] sm:min-h-[28rem]">
        <Image
          src="/store/sneaker-template/closing.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#2A1C14]/45" />
        <div className="relative mx-auto flex min-h-[22rem] max-w-[1440px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[28rem]">
          <h2
            className="max-w-3xl text-[32px] font-semibold leading-[1.1] text-white sm:text-[48px]"
            style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
          >
            Build Your Style With Confident Steps By Wearing Our Sneakers.
          </h2>
          <Link
            href={`${path}/search`}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#F5F0EA] px-8 text-sm font-semibold text-[#2A1C14] transition hover:bg-white"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}
