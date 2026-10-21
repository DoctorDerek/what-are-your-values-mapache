import { defineConfig } from "eslint/config"
import gitignore from "eslint-config-flat-gitignore"
import nextConfig from "eslint-config-next"
import nextTypeScript from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import "eslint-plugin-only-warn"

const eslintConfig = defineConfig([
  gitignore(),
  ...nextConfig,
  {
    name: "wayvm/typescript",
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [nextTypeScript],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          reportUsedIgnorePattern: true,
        },
      ],
    },
  },
  {
    name: "wayvm/native-static-assets",
    files: ["apps/mobile/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["^@game/data/assets/.+\\.(png|riv)$"] },
      ],
    },
  },
  {
    name: "wayvm/gifenc-ambient-declaration",
    files: ["packages/utils/src/EncodeGif.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": [
        "error",
        { path: "always" },
      ],
    },
  },
  {
    name: "wayvm/next-app-root",
    settings: {
      next: {
        rootDir: "apps/web/",
      },
    },
  },
  eslintConfigPrettier,
])

export default eslintConfig
