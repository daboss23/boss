import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // `npm run dev` serves the UI only. The client falls back to local
    // calculation when /api is unreachable, so the full flow still works.
    // Use `npm run dev:full` (vercel dev) for the API + database.
    proxy: process.env.API_PROXY ? { "/api": process.env.API_PROXY } : undefined,
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
