import { TEMPLATES } from "@glamsite/shared/templates";
import { ownerSignupHref } from "@/components/marketing/nav";

/** Placeholder until the stage 3 storefront (gallery, pricing, Stripe checkout). */
export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 md:pt-32">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-700/60">Glam Site Studios</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-ink-950 md:text-6xl">
          Websites for hair and beauty businesses
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-700">
          Pick a design, add your services, team and photos, and your site is live. Online booking is on the way.
        </p>
        <a
          href={ownerSignupHref()}
          className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-medium text-white transition hover:bg-navy/90"
        >
          Get your website
        </a>
      </section>

      <section id="templates" className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold text-ink-950">Templates</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <li key={template.id} className="rounded-2xl border border-wire bg-white p-6">
              <p className="font-display text-xl font-semibold text-ink-950">{template.name}</p>
              <p className="mt-1 text-sm text-ink-700">{template.tagline}</p>
              <a
                href={`/demo/${template.id}`}
                className="mt-5 inline-flex text-sm font-medium text-brand underline-offset-4 hover:underline"
              >
                View live demo →
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
