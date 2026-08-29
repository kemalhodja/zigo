import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: "#09090B", // True sharp black
        crystal: "#0047FF", // Electric cobalt blue (The singular avant-garde accent)
        berry: "#18181B", // Dark zinc instead of pink
        aqua: "#27272A", // Slate/Zinc tones instead of playful colors
        peach: "#3F3F46", 
        mint: "#52525B", 
        sun: "#71717A",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "zigo-micro": ["var(--zigo-text-micro)", { lineHeight: "1.2", letterSpacing: "0.02em" }],
        "zigo-caption": ["var(--zigo-text-caption)", { lineHeight: "1.35", letterSpacing: "0.01em" }],
        "zigo-meta": ["var(--zigo-text-meta)", { lineHeight: "1.35", letterSpacing: "0.01em" }],
        "zigo-body": ["var(--zigo-text-body)", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        "zigo-title-sm": ["var(--zigo-text-title-sm)", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "zigo-title": ["var(--zigo-text-title)", { lineHeight: "1.25", letterSpacing: "-0.03em" }],
        "zigo-title-lg": ["var(--zigo-text-title-lg)", { lineHeight: "1.25", letterSpacing: "-0.04em" }],
        "zigo-display": ["var(--zigo-text-display)", { lineHeight: "1.15", letterSpacing: "-0.05em" }],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.05)", // Sharper, more subtle shadow
        sharp: "0 4px 12px rgba(0, 0, 0, 0.1)", // For avant-garde boxes
      },
    },
  },
  plugins: [],
};

export default config;
