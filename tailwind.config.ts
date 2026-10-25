import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 딥테일 브랜드 색상
        brand: {
          DEFAULT: "#036DB7", // 밝은 블루
          mid: "#014777", // 미드 네이비
          deep: "#003B63", // 딥 네이비
          tint: "#E8F2FA",
          soft: "#CFE4F4",
        },
        ink: { DEFAULT: "#10202E", sub: "#47596A", mute: "#5D6E7E" },
        line: "#E4EAF0",
        canvas: "#F3F6F9",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(180deg, #036DB7 0%, #014777 55%, #003B63 100%)",
      },
      boxShadow: {
        card: "0 2px 10px rgba(1,71,119,0.08)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        "nav-progress": { from: { width: "0%" }, "30%": { width: "55%" }, to: { width: "90%" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out both",
        "nav-progress": "nav-progress 2.5s cubic-bezier(.1,.7,.2,1) forwards",
        shimmer: "shimmer 1.2s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
