import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Platform (dashboard + marketing) brand palette — distinct from storefront templates,
        // which each carry their own palette per-seller. Deep indigo/ink base, signal-orange accent
        // for actions that matter (packed, dispatched, paid).
        ink: {
          950: "#0B0E14",
          900: "#12161F",
          800: "#1B2130",
          700: "#2A3244",
        },
        canvas: "#F6F5F2",
        signal: {
          DEFAULT: "#FF5A1F",
          soft: "#FFE4D6",
        },
        wire: "#E4E1D8",
        // Light admin theme (Shopeers-inspired). Kept alongside ink/signal
        // so login and older surfaces can migrate without breaking.
        mist: "#F7F8FA",
        brand: {
          DEFAULT: "#3B6FF0",
          soft: "#EBF1FE",
        },
        navy: "#191A2D",
        delta: {
          up: "#059669",
          "up-soft": "#ECFDF5",
          down: "#E11D48",
          "down-soft": "#FFF1F2",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
