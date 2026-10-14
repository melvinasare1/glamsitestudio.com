import { Bodoni_Moda, Manrope } from "next/font/google";
import Header, { Wordmark } from "@/components/marketing/Header";
import { marketingNav, ownerLoginHref } from "@/components/marketing/nav";

const didone = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-didone",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  // Next has no fallback metrics for Bodoni Moda; use the declared fallbacks as-is.
  adjustFontFallback: false,
  fallback: ["Didot", "Bodoni 72", "Georgia", "serif"],
});

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${didone.variable} ${sans.variable} min-h-screen bg-porcelain font-sans text-plum`}>
      <Header />
      {children}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[82rem] flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm text-mauve">Websites for hair and beauty businesses.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mauve">
            {marketingNav.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-plum">
                {link.label}
              </a>
            ))}
            <a href={ownerLoginHref()} className="hover:text-plum">
              Log in
            </a>
          </nav>
        </div>
        <p className="mx-auto max-w-[82rem] px-5 pb-10 text-xs text-mauve/80 md:px-8">
          © {new Date().getFullYear()} Glam Site Studios
        </p>
      </footer>
    </div>
  );
}
