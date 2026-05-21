import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "hsl(var(--background))",
          dark: "hsl(var(--background))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          dark: "hsl(var(--foreground))",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
          dark: "hsl(var(--border))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          dark: "hsl(var(--card))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          dark: "hsl(var(--muted))",
        },
        "muted-foreground": {
          DEFAULT: "hsl(var(--muted-foreground))",
          dark: "hsl(var(--muted-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          dark: "hsl(var(--secondary))",
        },
        "secondary-foreground": {
          DEFAULT: "hsl(var(--secondary-foreground))",
          dark: "hsl(var(--secondary-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
