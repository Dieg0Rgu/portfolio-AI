import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bento: {
          bg: "#050e0c",
          panel: "#0a1b16",
          panelHover: "#0e241e",
          border: "rgba(52, 211, 153, 0.15)",
          borderHover: "rgba(52, 211, 153, 0.35)",
          emerald: "#10b981",
          mint: "#34d399",
          muted: "#628b80",
          text: "#e3f3ee",
          darkMuted: "#132c25",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        bento: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(16, 185, 129, 0.08)",
        bentoGlow: "0 0 25px -4px rgba(16, 185, 129, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
