import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#4d6dba",
          secondary: "#2a344a",
        },
      },
      boxShadow: {
        nav: "0 1px 0 rgba(42, 52, 74, 0.06), 0 8px 24px rgba(42, 52, 74, 0.06)",
        "nav-inner": "inset 0 1px 2px rgba(42, 52, 74, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
