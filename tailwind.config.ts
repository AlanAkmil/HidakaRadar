import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0E14",
        panel: "#101623",
        "panel-line": "#1E2635",
        amber: "#FFB000",
        cyan: "#4CC9F0",
        phosphor: "#5EEAD4",
        alert: "#FF5F56",
        mist: "#8A93A6",
      },
      fontFamily: {
        display: ["var(--font-chakra)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
