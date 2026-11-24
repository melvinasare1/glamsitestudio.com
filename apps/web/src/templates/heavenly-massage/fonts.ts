import { Montserrat, Playfair_Display } from "next/font/google";

export const heavenlySerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--hm-font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  fallback: ["Playfair Display", "Georgia", "serif"],
});

export const heavenlySans = Montserrat({
  subsets: ["latin"],
  variable: "--hm-font-sans",
  weight: ["400", "500", "600"],
  fallback: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
});
