import gitignore from "eslint-config-flat-gitignore"
import nextConfig from "eslint-config-next"
import nextTypeScript from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import { defineConfig } from "eslint/config"
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
  {
    name: "mapache/web-component-styling",
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/generated/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@mui/*",
                "@emotion/*",
                "styled-components",
                "styled-components/*",
              ],
              message:
                "Use the project’s Tailwind utilities for component styling.",
            },
            {
              group: ["*.css", "**/*.css", "!@/app/globals.css"],
              message:
                "Import the shared Tailwind entry point and style components with utilities.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: [
            "",
            ":matches(TSAsExpression, TSSatisfiesExpression, ConditionalExpression, LogicalExpression) > ",
          ]
            .map(
              (wrapper) =>
                `JSXOpeningElement[name.type='JSXIdentifier'][name.name=/^[a-z]/] > JSXAttribute[name.name='style'] > JSXExpressionContainer > ${wrapper}ObjectExpression > Property[computed=false]:matches([key.type='Identifier'], [key.type='Literal'][key.value!=/^--/])`,
            )
            .join(", "),
          message:
            "Express DOM appearance with Tailwind utilities. Pass runtime data through CSS custom properties.",
        },
      ],
    },
  },
  eslintConfigPrettier,
])

export default eslintConfig
