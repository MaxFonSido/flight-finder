import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dusk: {
          950: "#0B1120",
          900: "#111A2E",
          800: "#1A2740",
          700: "#26365A",
          600: "#3A4E7A",
        },
        runway: {
          400: "#FFC24B",
          500: "#F5A623",
          600: "#D98A0E",
        },
        haze: {
          100: "#EDF1F9",
          300: "#B9C4DC",
          500: "#8493B8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "dusk-gradient":
          "radial-gradient(circle at 20% -10%, rgba(58,78,122,0.45), transparent 55%), radial-gradient(circle at 90% 10%, rgba(245,166,35,0.12), transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
