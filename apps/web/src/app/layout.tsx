import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glam Site Studios: websites for hair and beauty businesses",
  description: "Beautiful websites for salons, barbers and beauty studios, live in a day.",
};

/** Shared by the marketing site and every salon site, so it loads no fonts of its own. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
