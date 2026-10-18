import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site at /Health-Planner/. Local dev stays at /.
const base = process.env.GITHUB_ACTIONS ? "/Health-Planner/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
