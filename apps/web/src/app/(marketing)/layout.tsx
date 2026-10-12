import Header from "@/components/marketing/Header";
import { marketingNav, sellerLoginHref, sellerOnboardingHref } from "@/components/marketing/nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loginHref = sellerLoginHref();
  const onboardingHref = sellerOnboardingHref();

  return (
    <>
      <Header />
      {children}
      <footer className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold">Glam Site Studios</p>
              <p className="mt-2 max-w-xs text-sm text-white/70">
                Storefront first. Fulfilment if you want it.
              </p>
            </div>
            <div className="flex flex-col gap-6 sm:items-end">
              <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
                {marketingNav.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={loginHref}
                  className="text-sm font-medium text-white/80 transition hover:text-white"
                >
                  Login
                </a>
                <a
                  href={onboardingHref}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-navy transition hover:bg-white/90"
                >
                  Get your website
                </a>
              </div>
            </div>
          </div>
          <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
            © {new Date().getFullYear()} Glam Site Studios
          </p>
        </div>
      </footer>
    </>
  );
}
