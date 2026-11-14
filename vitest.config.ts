import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "happy-dom",
    exclude: [
      ...configDefaults.exclude,
      "e2e/**/*.spec.ts",
      "apps/mobile/components/**/*.test.tsx",
    ],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      include: [
        "apps/web/{app,components,lib}/**/*.{ts,tsx}",
        "apps/mobile/lib/**/*.ts",
        "packages/*/src/**/*.{ts,tsx}",
        "scripts/animal-assets/**/*.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}"],
      thresholds: {
        statements: 79,
        branches: 79,
        functions: 79,
        lines: 79,
      },
    },
  },
})
