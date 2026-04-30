import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // VeRAX is single-theme — no dark mode
  theme: {
    extend: {
      colors: {
        // ── Neumorphic surface ──
        base: {
          DEFAULT: "var(--base)",       // #dde3ea — the one and only background
          dark:    "var(--base-dark)",  // #c8d0da — shadow-side tint
          mid:     "var(--base-mid)",   // #d0d8e2 — mid-depth tint
          light:   "var(--base-light)", // #edf1f6 — highlight-side tint
        },
        // ── Primary accent — Deep Instrument Steel ──
        accent: {
          DEFAULT: "var(--accent)",      // #1c3d5a
          mid:     "var(--accent-mid)",  // #2a5278 — hover
          glow:    "var(--accent-glow)", // rgba(28,61,90,0.35)
        },
        // ── Instrument amber — secondary accent ──
        // NOTE: merges with Tailwind's built-in amber scale;
        // DEFAULT adds bg-amber; existing bg-amber-500 etc. are unaffected.
        amber: {
          DEFAULT: "var(--amber)",       // #c47d1a — LED displays, gauge needles
          glow:    "var(--amber-glow)",  // rgba(196,125,26,0.4)
          light:   "var(--amber-light)", // #e8a040
        },
        // ── Financial semantic ──
        paid: {
          DEFAULT: "var(--paid)",        // #2d6a4f
          glow:    "var(--paid-glow)",   // rgba(45,106,79,0.45)
        },
        overdue: {
          DEFAULT: "var(--overdue)",     // #c4540a
          glow:    "var(--overdue-glow)",// rgba(196,84,10,0.45)
        },
        draft: {
          DEFAULT: "var(--draft)",       // #5a6a7e
          glow:    "var(--draft-glow)",  // rgba(90,106,126,0.4)
        },
        // ── Text — named "ink" to avoid collision with Tailwind's textColor utilities ──
        ink: {
          DEFAULT: "var(--text)",        // #1a2230
          mid:     "var(--text-mid)",    // #3a4a5c
        },
        muted: {
          DEFAULT: "var(--muted)",       // #6b7a90
          light:   "var(--muted-light)", // #8a9ab0
        },
        // ── Document ──
        paper: {
          DEFAULT: "var(--paper)",       // #fefef8
          warm:    "var(--paper-warm)",  // #f5f0e8
        },
        leather: {
          DEFAULT: "var(--leather)",     // #1e1a16 — dark sidebar
        },
      },

      boxShadow: {
        // Raised from base (cards, buttons, panels)
        "raised":     "var(--shadow-raised)",
        "raised-lg":  "var(--shadow-raised-lg)",
        "soft":       "var(--shadow-soft)",
        // Pressed into base (inputs, chart wells, gauge faces)
        "inset":      "var(--shadow-inset)",
        "inset-sm":   "var(--shadow-inset-sm)",
        // Instrument-specific
        "knob":       "var(--shadow-knob)",
        "gauge":      "var(--shadow-gauge)",
        // Document
        "paper":      "var(--shadow-paper)",
        // Accent button glow
        "accent-btn": "var(--shadow-accent-btn)",
        // LED panel enclosure
        "led":        "var(--shadow-led)",
      },

      borderRadius: {
        // Named tokens — do NOT override Tailwind's built-in rounded-sm etc.
        "card":  "var(--r-card)",   // 16px — cards, modals
        "panel": "var(--r-panel)",  // 12px — inner panels, dropdowns
        "btn":   "var(--r-btn)",    // 10px — all buttons (never full-pill)
        "input": "var(--r-input)",  //  8px — text inputs, selects
        "tight": "var(--r-sm)",     //  6px — badges, tags, tooltips
      },

      fontFamily: {
        // Replaces DM Sans (sans) and Syne (display)
        sans:  ["Instrument Sans", "system-ui", "sans-serif"],
        // DM Mono unchanged
        mono:  ["DM Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        // Lora — invoice body text, formal document sections
        serif: ["Lora", "Georgia", "serif"],
      },

      fontSize: {
        // Hero KPI numbers — DM Mono, tabular
        "kpi":        ["64px",   { lineHeight: "1",   letterSpacing: "-0.04em", fontWeight: "700" }],
        "kpi-sm":     ["52px",   { lineHeight: "1",   letterSpacing: "-0.03em", fontWeight: "700" }],
        // Headings — Instrument Sans
        "page":       ["30px",   { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "section":    ["19px",   { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "card-title": ["14px",   { lineHeight: "1.4", fontWeight: "600" }],
        // UI body & labels
        "body-ui":    ["13px",   { lineHeight: "1.7", fontWeight: "400" }],
        "label-ui":   ["10px",   { lineHeight: "1.4", letterSpacing: "0.12em", fontWeight: "600" }],
        "value":      ["12px",   { lineHeight: "1.4", fontWeight: "500" }],
        // Document / invoice — Lora
        "doc-body":   ["12.5px", { lineHeight: "1.8", fontWeight: "400" }],
        "doc-total":  ["16px",   { lineHeight: "1.4", fontWeight: "700" }],
      },

      transitionProperty: {
        // Sidebar collapse transitions
        "margin":       "margin",
        "width":        "width",
        "margin-width": "margin, width",
        // Neumorphic raised ↔ pressed transitions
        "shadow":       "box-shadow",
      },
    },
  },
  plugins: [],
};

export default config;
