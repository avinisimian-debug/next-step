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
  // The app's tsconfig keeps JSX for Next to compile; tests that render components need the automatic runtime.
  oxc: { jsx: { runtime: "automatic" } },
  test: { include: ["src/**/*.test.ts", "src/**/*.test.tsx", "supabase/tests/**/*.test.ts"], environment: "node" },
});
