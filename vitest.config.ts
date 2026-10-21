import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside a React Server Component bundle; tests import server modules directly.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
  test: { include: ["src/**/*.test.ts", "supabase/tests/**/*.test.ts"], environment: "node" },
});
