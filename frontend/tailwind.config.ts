import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        fintech: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          text: "#0F172A",
          muted: "#64748B",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        }
      },
    },
  },
  plugins: [],
};
export default config;
