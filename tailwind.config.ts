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
        mist: "#000000",
        paper: {
          DEFAULT: "#0D0D0D",
          sunk: "#080808"
        },
        line: {
          DEFAULT: "#262626",
          soft: "#1A1A1A"
        },
        ink: {
          DEFAULT: "#F5F5F5",
          soft: "#A3A3A3",
          faint: "#6B6B6B"
        },
        bloom: {
          DEFAULT: "#FFFFFF",
          soft: "#1F1F1F",
          strong: "#FFFFFF"
        },
        sage: {
          DEFAULT: "#D4D4D4",
          soft: "#1E1E1E"
        },
        amber: {
          DEFAULT: "#D4D4D4",
          soft: "#1E1E1E"
        },
        coral: {
          DEFAULT: "#F5F5F5",
          soft: "#242424"
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
        soft: "0 1px 2px rgba(0,0,0,0.5), 0 8px 24px -12px rgba(0,0,0,0.7)",
        lifted: "0 4px 16px rgba(0,0,0,0.6), 0 20px 48px -16px rgba(255,255,255,0.08)",
        glow: "0 0 0 4px rgba(255,255,255,0.1)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(ellipse 60% 40% at 15% 0%, rgba(255,255,255,0.05), transparent), radial-gradient(ellipse 50% 35% at 90% 10%, rgba(255,255,255,0.03), transparent)"
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

