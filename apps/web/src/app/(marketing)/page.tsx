import type { Metadata } from "next";
import { Check } from "lucide-react";
import { DesktopFrame } from "@/components/marketing/DeviceFrames";
import { LeadForm } from "@/components/marketing/LeadForm";
import { SitePreview } from "@/components/marketing/SitePreview";
import { TemplateGallery } from "@/components/marketing/TemplateGallery";
import { ownerSignupHref } from "@/components/marketing/nav";

export const metadata: Metadata = {
  title: "Glam Site Studios: websites for salons, barbers and beauty studios",
  description:
    "A beautiful website for your hair or beauty business, live today. Add your services, prices and photos from your phone. First month $1.",
};

const BUSINESSES = ["Hair salons", "Barbers", "Nail studios", "Lash & brow", "Makeup artists"];

const STEPS = [
  {
    title: "Pick a design",
    body: "Choose the template that feels like your business. You can switch later without losing anything.",
  },
  {
    title: "Add your details",
    body: "Services and prices, your team, photos of your work, opening hours. All from a simple dashboard that works on your phone.",
  },
  {
    title: "Share your link",
    body: "Put it in your Instagram bio, on Google and in WhatsApp. Clients see your prices and book in a tap.",
  },
];

const INCLUDED = [
  ["Your price list", "Grouped by category, with durations and “from” prices."],
  ["Your team", "Photos, roles and a line about each person."],
  ["Gallery and reviews", "Show your best work and what clients say."],
  ["Hours and map", "Opening times and directions, always up to date."],
  ["Book buttons", "Linked to Fresha, Booksy, Calendly or whatever you use now."],
  ["Message form", "Enquiries land in your dashboard, not lost in DMs."],
  ["Your own address", "yourname.glamsitestudio.com, or connect your own domain."],
  ["Made for phones", "Most clients find you on Instagram, so it's built for small screens first."],
];

const FAQS = [
  {
    q: "Do I need to know anything about websites?",
    a: "No. You fill in simple forms: your services, prices, photos and hours. We handle hosting, security and keeping it online.",
  },
  {
    q: "I already use Fresha or Booksy. Can I keep it?",
    a: "Yes. Paste your booking link and every Book button on your site goes there. Our own booking, with deposits and reminders, is coming soon as an optional add-on.",
  },
  {
    q: "What happens after the first month?",
    a: "Hosting is $15 a month, or $150 a year. You can cancel any time, and your site goes offline at the end of the period you've paid for.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Every site gets a free yourname.glamsitestudio.com address, and you can connect a domain you own. If you'd rather we set it up, that's part of the done-for-you option.",
  },
  {
    q: "Can I change my template later?",
    a: "Any time. Every template uses the same content, so switching keeps your text, photos, services and team exactly as they are.",
  },
];

export default function HomePage() {
  const signup = ownerSignupHref();

  return (
    <main>
      {/* Hero: copy on the left; the real Salon template running on a coded desktop screen. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FCEFF3] to-[#FDF5F7]">
        <div className="mx-auto max-w-[82rem] px-5 pt-10 md:px-8 lg:flex lg:min-h-[36rem] lg:items-center lg:py-14">
          <div className="relative z-10 lg:w-[48%]">
            <h1 className="font-didone text-[3.1rem] font-semibold leading-[0.92] tracking-[-0.045em] sm:text-7xl lg:text-[3.85rem] xl:text-[4.35rem]">
              Your salon&apos;s
              <br />
              website, live today.
            </h1>
            <p className="mt-7 max-w-[30rem] text-lg leading-relaxed text-plum/80 md:text-xl">
              Pick a design, add your services and photos, and send clients one link from your Instagram.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-4">
              <a
                href={signup}
                className="rounded-full bg-berry px-11 py-4 text-base font-semibold text-white shadow-[0_12px_30px_-12px_rgba(180,35,95,0.7)] transition-colors hover:bg-berry-dark"
              >
                Get your website
              </a>
              <a
                href="#templates"
                className="border-b-2 border-berry/40 pb-0.5 text-base font-semibold text-plum transition-colors hover:border-berry"
              >
                View templates
              </a>
            </div>
            <p className="mt-12 text-sm text-plum/70">Works with the booking app you already use</p>
            <ul className="mt-3 flex flex-wrap items-center gap-x-9 gap-y-2 text-2xl font-bold tracking-[-0.03em] text-plum">
              <li>Fresha</li>
              <li>Booksy</li>
              <li>Acuity</li>
              <li className="text-base font-medium tracking-normal text-plum/60">and more</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-[82rem] px-5 pb-16 md:px-8 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[50%] lg:items-center lg:px-0 lg:pb-0 lg:pr-8">
          <DesktopFrame label="The Salon template on a desktop screen, with demo content">
            <SitePreview templateId="luxe" viewportWidth={1280} viewportHeight={800} />
          </DesktopFrame>
        </div>
      </section>

      <section id="templates" className="scroll-mt-20 bg-[#FBEAF0]">
        <div className="mx-auto max-w-[82rem] px-5 py-16 md:px-8 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-didone text-5xl font-medium leading-none tracking-[-0.03em] md:text-7xl">
              Explore our templates
            </h2>
            <a
              href="/demo/salon"
              className="rounded-full border border-plum/25 bg-porcelain px-7 py-3.5 text-sm font-semibold transition-colors hover:border-plum"
            >
              Try a live demo
            </a>
          </div>
          <TemplateGallery />
        </div>
      </section>

      <section aria-label="Who it's for" className="border-y border-hairline bg-white">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 py-6 font-didone text-xl italic text-plum md:justify-between md:px-8">
          {BUSINESSES.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
        <h2 className="max-w-xl font-didone text-4xl leading-tight md:text-5xl">From your phone to online in an afternoon</h2>
        <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-plum/15 pt-6">
              <span className="font-didone text-5xl text-berry" aria-hidden>
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-mauve">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-petal">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-28">
          <div>
            <h2 className="font-didone text-4xl leading-tight md:text-5xl">Everything a client looks for</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-mauve">
              Prices, photos, your team and how to book. The things clients ask about in your DMs, answered before they
              ask.
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {INCLUDED.map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-berry" aria-hidden />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mauve">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 bg-plum text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <h2 className="font-didone text-4xl leading-tight md:text-5xl">Simple pricing</h2>
          <p className="mt-4 max-w-lg leading-relaxed text-white/70">
            One payment for your template, then hosting each month. Your first month is $1.
          </p>

          <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-0">
            <div className="md:pr-12">
              <h3 className="text-lg font-semibold">Do it yourself</h3>
              <p className="mt-4 font-didone text-6xl">
                $27<span className="ml-2 align-middle font-sans text-base text-white/70">and up, one-off</span>
              </p>
              <p className="mt-2 text-white/70">then $1 for your first month, $15/month after</p>
              <ul className="mt-8 grid gap-3 text-white/90">
                {[
                  "Your template, ready in minutes",
                  "Edit everything from your dashboard",
                  "Free yourname.glamsitestudio.com address",
                  "Hosting, security and updates included",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-petal-deep" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={signup}
                className="mt-10 inline-flex rounded-full bg-berry px-7 py-3.5 font-semibold text-white transition-colors hover:bg-berry-dark"
              >
                Get your website
              </a>
            </div>

            <div className="border-white/15 md:border-l md:pl-12">
              <h3 className="text-lg font-semibold">Done for you</h3>
              <p className="mt-4 font-didone text-6xl">
                $299<span className="ml-2 align-middle font-sans text-base text-white/70">one-off</span>
              </p>
              <p className="mt-2 text-white/70">plus the same hosting: $1 first month, $15/month after</p>
              <ul className="mt-8 grid gap-3 text-white/90">
                {[
                  "We add your services, prices, team and photos",
                  "We connect your own domain",
                  "A 30-minute call to launch it together",
                  "Everything in Do it yourself",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-petal-deep" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#done-for-you"
                className="mt-10 inline-flex rounded-full border border-white/40 px-7 py-3.5 font-semibold transition-colors hover:border-white"
              >
                Ask us to set it up
              </a>
            </div>
          </div>

          <p className="mt-16 border-t border-white/15 pt-6 text-sm text-white/70">
            Prefer to pay yearly? Hosting is $150 a year. Online booking with deposits and reminders is coming soon as an
            optional add-on.
          </p>
        </div>
      </section>

      <section id="done-for-you" className="mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-28">
        <div>
          <h2 className="font-didone text-4xl leading-tight md:text-5xl">Rather we did it?</h2>
          <p className="mt-5 max-w-sm leading-relaxed text-mauve">
            Tell us about your business. We&apos;ll get in touch to book a short call, then build your site with your
            photos, prices and team.
          </p>
        </div>
        <LeadForm />
      </section>

      <section id="faq" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
          <h2 className="font-didone text-4xl leading-tight md:text-5xl">Questions</h2>
          <div className="mt-10 divide-y divide-hairline border-y border-hairline">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                  {item.q}
                  <span className="text-2xl font-normal text-berry transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-mauve">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8 md:py-32">
        <h2 className="mx-auto max-w-2xl font-didone text-5xl leading-[1.05] md:text-6xl">
          Give clients somewhere better than your DMs.
        </h2>
        <a
          href={signup}
          className="mt-10 inline-flex rounded-full bg-berry px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-berry-dark"
        >
          Get your website
        </a>
        <p className="mt-4 text-sm text-mauve">First month $1. Cancel any time.</p>
      </section>
    </main>
  );
}
