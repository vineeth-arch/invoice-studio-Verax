import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Design-token colours — resolve via CSS variables
        "theme-bg": "var(--bg)",
        "theme-surface": "var(--surface)",
        "theme-surface-raised": "var(--surface-raised)",
        "theme-border": "var(--border)",
        "theme-border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        "accent-yellow": "var(--accent-yellow)",
        "accent-yellow-muted": "var(--accent-yellow-muted)",
        "accent-yellow-text": "var(--accent-yellow-text)",

        "accent-purple": "var(--accent-purple)",
        "accent-purple-muted": "var(--accent-purple-muted)",
        "accent-purple-text": "var(--accent-purple-text)",

        "accent-mint": "var(--accent-mint)",
        "accent-mint-bg": "var(--accent-mint-bg)",
        "accent-mint-muted": "var(--accent-mint-muted)",
        "accent-mint-text": "var(--accent-mint-text)",

        "accent-coral": "var(--accent-coral)",
        "accent-coral-muted": "var(--accent-coral-muted)",
        "accent-coral-text": "var(--accent-coral-text)",

        "sidebar-bg": "var(--sidebar-bg)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-text-muted": "var(--sidebar-text-muted)",

        // Legacy brand palette — kept for backward compatibility
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fc",
          400: "#38aaf8",
          500: "#0e90ea",
          600: "#0271c8",
          700: "#035aa2",
          800: "#074d85",
          900: "#0c416e",
          950: "#082849",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "Syne", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "DM Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        bento: "20px",
        card: "16px",
      },
      transitionProperty: {
        margin: "margin",
        width: "width",
        "margin-width": "margin, width",
      },
    },
  },
  plugins: [],
};
export default config;
