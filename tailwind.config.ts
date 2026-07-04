import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: "#101828",
        crystal: "#7C3AED",
        berry: "#EC4899",
        aqua: "#06B6D4",
        peach: "#FB7185",
        mint: "#2DD4BF",
        sun: "#FACC15",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "zigo-micro": ["var(--zigo-text-micro)", { lineHeight: "1.2" }],
        "zigo-caption": ["var(--zigo-text-caption)", { lineHeight: "1.35" }],
        "zigo-meta": ["var(--zigo-text-meta)", { lineHeight: "1.35" }],
        "zigo-body": ["var(--zigo-text-body)", { lineHeight: "1.5" }],
        "zigo-title-sm": ["var(--zigo-text-title-sm)", { lineHeight: "1.25" }],
        "zigo-title": ["var(--zigo-text-title)", { lineHeight: "1.25" }],
        "zigo-title-lg": ["var(--zigo-text-title-lg)", { lineHeight: "1.25" }],
        "zigo-display": ["var(--zigo-text-display)", { lineHeight: "1.15" }],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(16, 24, 40, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
