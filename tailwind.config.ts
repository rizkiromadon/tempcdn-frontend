import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        mist: "#F6F7FB",
        paper: {
          DEFAULT: "#FFFFFF",
          sunk: "#F1F2F8"
        },
        line: {
          DEFAULT: "#E6E8F2",
          soft: "#EEF0F8"
        },
        ink: {
          DEFAULT: "#1F2430",
          soft: "#666C7D",
          // Was #9AA0B2 (2.3–2.6:1 against paper/mist/paper-sunk — fails
          // WCAG AA for text). Deepened while staying in the same cool-gray
          // family; now 5.6–6.3:1 against every background it's used on.
          faint: "#5B6072"
        },
        bloom: {
          DEFAULT: "#6366F1",
          soft: "#EEF0FE",
          strong: "#4F46E5"
        },
        sage: {
          // Was #2FBE86 (2.2–2.4:1 against paper/sage-soft — fails WCAG AA
          // for text; this color is used as badge/status text, not just a
          // decorative dot). Deepened while staying green; now 4.8–5.3:1.
          DEFAULT: "#187A54",
          soft: "#E7F9F1"
        },
        amber: {
          // Was #F3A455 (1.8–2.3:1 — fails WCAG AA for text). Deepened
          // while staying a warm orange (not brown); now 5.5–6.2:1.
          DEFAULT: "#8F5313",
          soft: "#FDF1E3"
        },
        coral: {
          // Was #F1685E (1.8–2.7:1 — fails WCAG AA for text). Deepened
          // while staying coral-red; now 5.1–5.9:1.
          DEFAULT: "#B03D33",
          soft: "#FDEBEA"
        }
      },
      fontFamily: {
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      borderRadius: {
        none: "0px",
        sm: "8px",
        DEFAULT: "12px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        full: "9999px"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,36,48,0.04), 0 8px 24px -12px rgba(31,36,48,0.10)",
        lifted: "0 4px 12px rgba(31,36,48,0.06), 0 16px 40px -16px rgba(31,36,48,0.16)",
        glow: "0 0 0 4px rgba(99,102,241,0.12)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(ellipse 60% 40% at 15% 0%, rgba(99,102,241,0.10), transparent), radial-gradient(ellipse 50% 35% at 90% 10%, rgba(47,190,134,0.08), transparent)"
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.05)", opacity: "1" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "conveyor-x": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        "dash-flow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "-48px 0" }
        },
        "count-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "pulse-slow": "pulse-slow 2.4s ease-in-out infinite",
        breathe: "breathe 3s ease-in-out infinite",
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fade-in 0.3s ease-out",
        "conveyor-x": "conveyor-x 32s linear infinite",
        "dash-flow": "dash-flow 1.1s linear infinite",
        "count-in": "count-in 0.5s cubic-bezier(0.16,1,0.3,1)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;

