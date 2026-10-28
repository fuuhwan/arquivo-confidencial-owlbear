import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base:
    command === "build"
      ? "/arquivo-confidencial-owlbear/"
      : "/",

  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
}));