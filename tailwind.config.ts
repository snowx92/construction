import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm neutral base
        sand: {
          50:  "oklch(97.8% 0.006 75)",
          100: "oklch(96.5% 0.008 75)",
          200: "oklch(93%   0.006 75)",
          300: "oklch(88%   0.007 75)",
          400: "oklch(80%   0.008 75)",
          500: "oklch(68%   0.008 75)",
          600: "oklch(55%   0.008 75)",
          700: "oklch(42%   0.008 75)",
          800: "oklch(30%   0.008 75)",
          900: "oklch(18%   0.008 75)",
        },
        // Warm stone accent
        accent: {
          DEFAULT: "oklch(55% 0.08 75)",
          sub:     "oklch(88% 0.04 75)",
          hover:   "oklch(52% 0.08 75)",
          muted:   "oklch(92% 0.03 75)",
        },
        // AI color — subtle blue-violet
        ai: {
          DEFAULT: "oklch(55% 0.06 260)",
          sub:     "oklch(94% 0.03 260)",
          line:    "oklch(70% 0.06 260)",
        },
        // Semantic
        success: {
          DEFAULT: "oklch(50% 0.12 145)",
          sub:     "oklch(94% 0.05 145)",
        },
        warning: {
          DEFAULT: "oklch(65% 0.10 75)",
          sub:     "oklch(94% 0.04 75)",
        },
        danger: {
          DEFAULT: "oklch(50% 0.15 25)",
          sub:     "oklch(94% 0.05 25)",
        },
        info: {
          DEFAULT: "oklch(52% 0.08 240)",
          sub:     "oklch(94% 0.04 240)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs:   ["0.75rem",  { lineHeight: "1.4" }],
        sm:   ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem",     { lineHeight: "1.6" }],
        lg:   ["1.15rem",  { lineHeight: "1.5" }],
        xl:   ["1.32rem",  { lineHeight: "1.4" }],
        "2xl": ["1.52rem", { lineHeight: "1.3" }],
        "3xl": ["1.75rem", { lineHeight: "1.25" }],
        "4xl": ["2.25rem", { lineHeight: "1.15" }],
        "5xl": ["3rem",    { lineHeight: "1.05" }],
      },
      borderRadius: {
        sm:   "8px",
        DEFAULT: "12px",
        md:   "12px",
        lg:   "20px",
        xl:   "28px",
        "2xl": "36px",
        full: "9999px",
      },
      boxShadow: {
        nav: "0 1px 3px oklch(0% 0 0 / 0.06), 0 0 0 1px oklch(90% 0.006 75 / 1)",
        card: "none",
        float: "0 4px 24px oklch(18% 0.008 75 / 0.06)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        shimmer:
          "linear-gradient(90deg, transparent 0%, oklch(96.5% 0.008 75) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
