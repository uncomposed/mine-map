import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  worker: { format: "es" },
  server: { port: 5173 },
  test: {
    exclude: ["tests/**/*.pw.spec.*", "e2e/**", "node_modules", "dist"],
  },
});
