import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB", // primary blue (buttons, links)
          dark: "#0B1220",    // hero navy background
          navy: "#0F1B3D",    // secondary navy for gradients
          sky: "#38BDF8",     // "Tech Career" accent blue
        },
        // SKCE portal palette (admin / student dashboards)
        skce: {
          navy: "#0F2F5F",
          "navy-2": "#173B67",
          blue: "#1459B8",
          orange: "#F97316",
          "orange-2": "#F97316",
          line: "#DCE6F2",
          tint: "#F4F7FB",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, #16234f 0%, #0b1220 55%, #060912 100%)",
        "skce-banner":
          "linear-gradient(118deg, #071C3A 0%, #0F2F5F 48%, #1B4B82 100%)",
      },
      boxShadow: {
        skce: "0 10px 24px -16px rgba(15, 47, 95, 0.28)",
        "skce-lg": "0 16px 32px -18px rgba(15, 47, 95, 0.35)",
      },
      keyframes: {
        "skce-fade-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 12px, 0)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "skce-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "skce-pop": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "skce-fade-up": "skce-fade-up 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards",
        "skce-fade-in": "skce-fade-in 0.2s ease both",
        "skce-pop": "skce-pop 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
