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
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ['Source Serif 4', 'Georgia', 'serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(44, 36, 32, 0.04)",
        DEFAULT: "0 1px 3px 0 rgba(44, 36, 32, 0.06), 0 1px 2px -1px rgba(44, 36, 32, 0.06)",
        md: "0 4px 6px -1px rgba(44, 36, 32, 0.06), 0 2px 4px -2px rgba(44, 36, 32, 0.06)",
        lg: "0 10px 15px -3px rgba(44, 36, 32, 0.06), 0 4px 6px -4px rgba(44, 36, 32, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
