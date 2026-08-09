import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#0B0C0D",
        surface: {
          DEFAULT: "#141618",
          raised: "#1B1E20",
          hatch: "#101214"
        },
        steel: {
          DEFAULT: "#3A3D40",
          light: "#54585C",
          dim: "#26292B"
        },
        bone: {
          DEFAULT: "#E8E6E1",
          dim: "#9A9B9C",
          faint: "#6B6D6F"
        },
        hazard: {
          DEFAULT: "#F4A226",
          dim: "#B8791C",
          glow: "#FFC661"
        },
        rust: {
          DEFAULT: "#C24F3D",
          dim: "#7A2E2E",
          glow: "#E06B52"
        },
        signal: {
          DEFAULT: "#4F9D6E"
        }
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "6px"
      },
      boxShadow: {
        rivet: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(0,0,0,0.6)",
        panel: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(244,162,38,0.25), 0 0 24px -4px rgba(244,162,38,0.35)"
      },
      backgroundImage: {
        "hazard-stripes":
          "repeating-linear-gradient(135deg, #F4A226 0px, #F4A226 10px, #0B0C0D 10px, #0B0C0D 20px)",
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")"
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "pulse-slow": "pulse-slow 2.4s ease-in-out infinite",
        scan: "scan 2.5s linear infinite",
        "fade-up": "fade-up 0.35s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
