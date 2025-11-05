import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff"
        },
        surface: {
          DEFAULT: "#101225",
          muted: "#1b1e3b",
          subtle: "#2a2e5c"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
