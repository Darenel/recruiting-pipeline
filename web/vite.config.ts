import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "demo" ? "/projects/recruiting/" : "/",
  define: {
    "import.meta.env.VITE_MODE": JSON.stringify(mode),
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
}));
