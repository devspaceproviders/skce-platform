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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, #16234f 0%, #0b1220 55%, #060912 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
