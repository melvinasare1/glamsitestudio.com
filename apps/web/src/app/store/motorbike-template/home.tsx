import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bike,
  Calendar,
  ChevronRight,
  CreditCard,
  Handshake,
  Tag,
  Shield,
  Truck,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import {
  getLiveRideBlogPosts,
  getLiveRideStorefrontSeller,
  getRideBlogPostsForStoreSlug,
  getRideSellerBySlug,
  listRideAccessories,
} from "@/components/store/motorbike-template/catalog";
import { rideProductPath, rideStoreBase } from "@/components/store/motorbike-template/demo-catalog";
import { RideProductCard } from "@/components/store/motorbike-template/product-card";
import { MotorbikePlaceholder } from "@/components/store/motorbike-template/placeholders";
import {
  RIDE_FEATURE_STRIP_FALLBACKS,
  RIDE_SHOP_CATEGORY_FALLBACKS,
  RIDE_TRUST_BADGE_FALLBACKS,
  RIDE_VALUE_PROP_FALLBACKS,
  rideList,
  rideOptionalList,
  rideText,
} from "@/components/store/motorbike-template/ride-content";
import { formatCedis, parsePriceCedis } from "@/lib/price";

const ORANGE = "#E8622C";

const TRUST_ICONS = [Tag, User, Shield, Calendar];
const FEATURE_ICONS = [Award, Wrench, Users, Handshake];
const VALUE_ICONS = [Bike, CreditCard, Truck];
const VALUE_HREFS = ["#featured", "/contact", "/contact"] as const;

function formatBlogDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function categorySlug(label: string, linkCategory: string): string {
  const fromLink = linkCategory.trim().toLowerCase().replace(/\s+/g, "");
  if (fromLink) return fromLink;
  return label.trim().toLowerCase().replace(/\s+/g, "");
}

export async function MotorbikeHome({ storeSlug }: { storeSlug?: string } = {}) {
  const base = rideStoreBase(storeSlug);
  const seller = storeSlug
    ? await getRideSellerBySlug(storeSlug)
    : await getLiveRideStorefrontSeller();
  const content = seller?.storeContent ?? {};
  const catalogAccessories = await listRideAccessories(storeSlug);
  const contentAccessories = rideOptionalList(content, "accessories");
  const accessories =
    contentAccessories.length > 0
      ? contentAccessories.map((item, index) => ({
          id: item.productId.trim() || `content-accessory-${index}`,
          name: item.name,
          priceCedis: parsePriceCedis(item.price),
          image: item.image,
          colors: [] as string[],
          rating: undefined as number | undefined,
          href: item.productId.trim()
            ? rideProductPath(item.productId.trim(), storeSlug)
            : `${base}/search?category=accessories`,
        }))
      : catalogAccessories.map((item) => ({
          id: item.id,
          name: item.name,
          priceCedis: item.priceCedis,
          image: item.image,
          colors: item.colors,
          rating: item.rating,
          href: rideProductPath(item.id, storeSlug),
        }));

  const contentBlog = rideOptionalList(content, "blogPosts");
  const cmsBlog =
    contentBlog.length > 0
      ? []
      : storeSlug
        ? await getRideBlogPostsForStoreSlug(storeSlug)
        : await getLiveRideBlogPosts();
  const blogPosts =
    contentBlog.length > 0
      ? contentBlog.map((post, index) => ({
          id: `content-blog-${index}`,
          title: post.title,
          excerpt: post.excerpt,
          dateLabel: post.date,
          imageUrl: post.image,
          href: post.href.trim() || `${base}/blog/${index + 1}`,
        }))
      : cmsBlog.map((post) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          dateLabel: formatBlogDate(post.publishedAt),
          imageUrl: post.imageUrl,
          href: `${base}/blog/${post.id}`,
        }));

  // Demo product IDs only exist in the template preview. Seller stores link the
  // banners to their own category listings and hide the demo prices.
  const promoHref = storeSlug
    ? `${base}/search?category=motorbikes`
    : rideProductPath("demo-motorbike-1");
  const darkBannerHref = storeSlug
    ? `${base}/search?category=bicycles`
    : rideProductPath("demo-bicycle-1");

  const heroHeadline = rideText(content, "heroHeadline");
  const heroSubtext = rideText(content, "heroSubtext");
  const heroImage = rideText(content, "heroImage");
  const shopHeading = rideText(content, "shopHeading");
  const categories = rideList(content, "shopCategories", RIDE_SHOP_CATEGORY_FALLBACKS);
  const trustBadges = rideList(content, "trustBadges", RIDE_TRUST_BADGE_FALLBACKS);
  const trustFeatures = rideList(content, "featureStrip", RIDE_FEATURE_STRIP_FALLBACKS);
  const valueFeatures = rideList(content, "valueProps", RIDE_VALUE_PROP_FALLBACKS);
  const promoHeadline = rideText(content, "promoHeadline");
  const promoKicker = rideText(content, "promoKicker");
  const promoBody = rideText(content, "promoBody");
  const promoImage = rideText(content, "promoImage");
  const accessoriesHeading = rideText(content, "accessoriesHeading");
  const darkBannerHeadline = rideText(content, "darkBannerHeadline");
  const darkBannerBody = rideText(content, "darkBannerBody");
  const darkBannerImage = rideText(content, "darkBannerImage");
  const darkBannerCalloutTitle = rideText(content, "darkBannerCalloutTitle");
  const darkBannerCalloutBody = rideText(content, "darkBannerCalloutBody");
  const blogHeading = rideText(content, "blogHeading");

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "motorbike-template"} path={base} />

      <section className="relative flex flex-col overflow-hidden bg-[#141414] md:min-h-[calc(100svh-5rem)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[#0c0c0c]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_42%,#6a4a32_0%,transparent_42%),radial-gradient(ellipse_at_60%_70%,#2a1c14_0%,transparent_50%)]" />
          <div className="absolute right-0 top-[20%] hidden h-[52%] w-[56%] md:block md:right-4 md:top-[18%] md:h-[50%]">
            <Image
              src={heroImage}
              alt=""
              fill
              unoptimized
              priority
              sizes="56vw"
              className="object-contain object-right"
            />
          </div>
          <div className="absolute inset-0 hidden bg-gradient-to-r from-[#141414] via-[#141414]/55 to-transparent md:block" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-8 pt-12 md:px-10 md:pb-36 md:pt-24">
          <h1
            className="max-w-xl whitespace-pre-line text-[42px] font-extrabold leading-[1.02] tracking-tight text-white md:text-[58px] lg:text-[68px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {heroHeadline}
          </h1>
          <p className="mt-6 max-w-[420px] text-[15px] leading-relaxed text-white/70 md:text-[16px]">
            {heroSubtext}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href={`${base}/search`}
              className="inline-flex items-center rounded-lg px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ORANGE }}
            >
              Shop Now
            </Link>
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center rounded-lg border border-white/90 bg-transparent px-7 py-3 text-sm font-semibold text-white"
            >
              Contact Us
            </Link>
          </div>
          <div className="relative mt-10 w-full md:hidden">
            <Image
              src={heroImage}
              alt=""
              width={1200}
              height={800}
              unoptimized
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 bg-black/45 backdrop-blur-[2px] md:absolute md:inset-x-0 md:bottom-0">
          <ul className="mx-auto grid max-w-[1400px] grid-cols-2 justify-items-center gap-y-5 px-6 py-5 md:flex md:flex-wrap md:items-center md:justify-center md:gap-x-16 md:px-10 md:py-6">
            {trustBadges.map((badge, index) => {
              const Icon = TRUST_ICONS[index % TRUST_ICONS.length];
              return (
                <li key={`${badge.label}-${index}`} className="flex items-center gap-3 text-white">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={1.6} />
                  <span className="text-[13px] font-medium tracking-wide">{badge.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="shop" className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1400px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-16">
          <h2
            className="text-[40px] font-extrabold tracking-tight text-[#141414] md:text-[48px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {shopHeading}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-12 md:gap-8">
            {categories.map((category, index) => {
              const slug = categorySlug(category.label, category.linkCategory);
              return (
              <article
                key={`${slug}-${index}`}
                id={slug}
                className="flex flex-col rounded-[28px] border border-[#D9D6CE] px-8 pb-9 pt-10 shadow-[0_8px_28px_rgba(20,20,20,0.06)] md:px-10 md:pb-11 md:pt-12"
                style={{ backgroundColor: "#FFFDFA" }}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-contain"
                  />
                </div>
                <p
                  className="mt-6 text-center text-[17px] font-extrabold uppercase tracking-[0.08em] text-[#141414] md:text-[19px]"
                  style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
                >
                  {category.label}
                </p>
                <Link
                  href={`${base}/search?category=${slug}`}
                  className="mx-auto mt-4 inline-flex items-center gap-1 rounded-full border border-[#141414] px-5 py-1.5 text-[12px] font-semibold text-[#141414] transition-colors hover:bg-[#141414] hover:text-white"
                >
                  View {category.label}
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                </Link>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] pb-8 md:pb-10">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div
            id="featured"
            className="relative grid overflow-hidden rounded-[28px] bg-[#141414] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]"
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse at 18% 48%, rgba(232,98,44,0.28) 0%, transparent 52%), radial-gradient(ellipse at 88% 60%, #4a3220 0%, transparent 48%)",
              }}
            />
            <div className="relative z-10 flex flex-col justify-center px-8 py-14 md:px-14 md:py-20 lg:px-16">
              <h2
                className="text-[30px] font-extrabold tracking-tight text-white md:text-[38px]"
                style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
              >
                {promoHeadline}
              </h2>
              <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
                {promoKicker}
              </p>
              {storeSlug ? null : (
                <p className="mt-2 text-[22px] font-semibold" style={{ color: ORANGE }}>
                  {formatCedis(18900)}
                </p>
              )}
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70 md:text-[15px]">
                {promoBody}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href={promoHref}
                  className="inline-flex items-center rounded-lg px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ORANGE }}
                >
                  More Info
                </Link>
                <Link
                  href={`${base}/search?category=motorbikes`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/90 px-7 py-3 text-sm font-semibold text-white"
                >
                  View Collections
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
            <Link
              href={promoHref}
              className="relative flex min-h-[280px] items-center justify-center px-4 py-6 md:min-h-[420px] md:px-6 md:py-8"
            >
              <Image
                src={promoImage}
                alt={promoHeadline}
                width={1536}
                height={1024}
                unoptimized
                className="h-auto w-[97%] object-contain"
              />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-20">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {trustFeatures.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
              <li
                key={`${feature.label}-${index}`}
                className="rounded-[24px] bg-[#FFFDFA] px-6 py-8 shadow-[0_8px_28px_rgba(20,20,20,0.06)] md:px-7 md:py-9"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: ORANGE }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.75} color="#fff" />
                </span>
                <h3
                  className="mt-5 text-[17px] font-extrabold leading-snug text-[#141414]"
                  style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
                >
                  {feature.label}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#141414]/50">{feature.body}</p>
              </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="accessories" className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1400px] px-6 pb-16 md:px-10 md:pb-20">
          <h2
            className="text-[40px] font-extrabold tracking-tight text-[#141414] md:text-[48px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {accessoriesHeading}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 md:mt-12">
            {accessories.map((item) => (
              <RideProductCard
                key={item.id}
                href={item.href}
                productId={item.id}
                name={item.name}
                priceCedis={item.priceCedis}
                image={item.image}
                colors={item.colors}
                rating={item.rating}
              />
            ))}
          </div>
          <div className="mt-12 flex justify-center md:mt-14">
            <Link
              href={`${base}/search?category=accessories`}
              className="inline-flex items-center rounded-lg px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ORANGE }}
            >
              View All Accessories
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-20">
          <ul className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-12">
            {valueFeatures.map((feature, index) => {
              const Icon = VALUE_ICONS[index % VALUE_ICONS.length];
              const href = VALUE_HREFS[index] ?? "/contact";
              return (
              <li key={`${feature.label}-${index}`} className="flex flex-col items-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#141414]">
                  <Icon className="h-7 w-7 text-white" strokeWidth={1.6} color="#fff" />
                </span>
                <h3
                  className="mt-6 text-[20px] font-extrabold text-[#141414]"
                  style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
                >
                  {feature.label}
                </h3>
                <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-[#141414]/50">{feature.body}</p>
                <a
                  href={href.startsWith("/") ? `${base}${href}` : href}
                  className="mt-6 inline-flex items-center rounded-lg border border-[#141414] px-5 py-2 text-[13px] font-semibold text-[#141414] transition-colors hover:bg-[#141414] hover:text-white"
                >
                  Learn More
                </a>
              </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-[#FFFFFF] pb-8 md:pb-10">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="relative grid overflow-hidden rounded-[28px] bg-[#141414] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)]">
            <Link
              href={darkBannerHref}
              className="relative flex min-h-[280px] items-center justify-center px-6 py-8 md:min-h-[400px] md:px-8 md:py-10"
            >
              <Image
                src={darkBannerImage}
                alt={darkBannerHeadline}
                width={1619}
                height={971}
                unoptimized
                className="h-auto w-[81%] object-contain"
              />
              <div className="absolute left-[8%] top-[22%] z-10 flex items-center">
                <div className="max-w-[210px] rounded-xl bg-black/55 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                  <p className="text-[12px] font-semibold leading-snug text-white">
                    {darkBannerCalloutTitle}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/55">
                    {darkBannerCalloutBody}
                  </p>
                </div>
                <span className="hidden h-px w-12 bg-white/70 sm:block" aria-hidden />
                <span className="hidden h-2 w-2 rounded-full bg-white sm:block" aria-hidden />
              </div>
            </Link>
            <div className="relative z-10 flex flex-col justify-center px-8 py-12 md:px-12 md:py-16 lg:pr-16">
              <h2
                className="text-[30px] font-extrabold tracking-tight text-white md:text-[36px]"
                style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
              >
                {darkBannerHeadline}
              </h2>
              {storeSlug ? null : (
                <p className="mt-2 text-[16px] font-medium text-white/55">
                  From {formatCedis(9450)}
                </p>
              )}
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70 md:text-[15px]">
                {darkBannerBody}
              </p>
              <Link
                href={darkBannerHref}
                className="mt-8 inline-flex w-fit items-center rounded-lg bg-white px-8 py-3 text-sm font-semibold text-[#141414] transition-opacity hover:opacity-90"
              >
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {blogPosts.length > 0 ? (
      <section id="blog" className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          <h2
            className="text-[40px] font-extrabold tracking-tight text-[#141414] md:text-[48px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {blogHeading}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 md:mt-12 md:gap-6">
            {blogPosts.map((post) => (
              <article key={post.id}>
                <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[24px] bg-[#E8E6E1]">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <MotorbikePlaceholder className="h-[70%] w-[80%] drop-shadow-[0_12px_16px_rgba(20,20,20,0.14)]" />
                  )}
                </div>
                {post.dateLabel ? (
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.14em] text-[#141414]/40">
                    {post.dateLabel}
                  </p>
                ) : null}
                <h3
                  className="mt-2 max-w-[280px] text-[18px] font-extrabold leading-snug text-[#141414]"
                  style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
                >
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mt-2 text-[14px] leading-relaxed text-[#141414]/50">{post.excerpt}</p>
                ) : null}
                <Link
                  href={post.href}
                  className="mt-5 inline-flex items-center rounded-lg border border-[#141414] px-4 py-2 text-[13px] font-semibold text-[#141414] transition-colors hover:bg-[#141414] hover:text-white"
                >
                  Read More
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}

