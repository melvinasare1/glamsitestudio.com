import { Montserrat, Playfair_Display } from "next/font/google";

/** Luxe type: Playfair Display headings, Montserrat body (from the Luxe style guide). */
export const luxeSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--lx-font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  fallback: ["Playfair Display", "Georgia", "serif"],
});

export const luxeSans = Montserrat({
  subsets: ["latin"],
  variable: "--lx-font-sans",
  weight: ["400", "500", "600"],
  fallback: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
});
