import { ESLint } from "eslint"
import { beforeAll, describe, expect, it } from "vitest"

const eslint = new ESLint({ cwd: process.cwd() })

beforeAll(async () => {
  await eslint.calculateConfigForFile("eslint.config.ts")
})

describe("repository ESLint coverage", () => {
  it.each([
    "apps/web/components/InformationPanel.tsx",
    "apps/mobile/components/NativeResults.tsx",
    "packages/data/src/Value.ts",
    "packages/machines/src/AchievementTransition.ts",
    "packages/machines/src/AchievementTransition.test.ts",
    "packages/utils/src/EncodeGif.ts",
    "scripts/animal-assets/prepareSeethingSwarmPresentationAssets.cli.ts",
    "e2e/lint-probe.spec.ts",
    "playwright.config.ts",
    "scripts/lint-probe.mts",
    "scripts/lint-probe.cts",
  ])("reports TypeScript findings in %s", async (filePath) => {
    const results = await eslint.lintText("export const value: any = 1", {
      filePath,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.fatalErrorCount).toBe(0)
    expect(results[0]?.messages).toEqual([
      expect.objectContaining({
        ruleId: "@typescript-eslint/no-explicit-any",
        severity: 1,
      }),
    ])
  })

  it("accepts typed JSX without losing React Hooks checks", async () => {
    const filePath = "apps/web/components/InformationPanel.tsx"
    const valid = await eslint.lintText(
      "export default function Control({ label }: Readonly<{ label: string }>) { return <button>{label}</button> }",
      { filePath },
    )
    const invalid = await eslint.lintText(
      "import { useState } from 'react'; export default function Control({ active }: Readonly<{ active: boolean }>) { if (active) useState(0); return <button>Continue</button> }",
      { filePath },
    )

    expect(valid[0]?.messages).toEqual([])
    expect(invalid[0]?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "react-hooks/rules-of-hooks" }),
      ]),
    )
  })

  it("allows unused callback arguments and omitted object-rest fields", async () => {
    const results = await eslint.lintText(
      "export function retain(value: { removed: number; retained: number }, _context: unknown) { const { removed, ...remaining } = value; return remaining }",
      { filePath: "packages/machines/src/lint-probe.ts" },
    )

    expect(results[0]?.messages).toEqual([])
  })

  it.each([
    "const unused = 1; export const retained = 2",
    "const _unused = 1; export const retained = 2",
    "import { unused } from './fixture'; export const retained = 2",
    "export function value(unused: number) { return 2 }",
    "export function value(_used: number) { return _used }",
  ])(
    "reports dead bindings or misleading ignored names: %s",
    async (source) => {
      const results = await eslint.lintText(source, {
        filePath: "packages/machines/src/lint-probe.ts",
      })

      expect(results[0]?.messages).toEqual([
        expect.objectContaining({
          ruleId: "@typescript-eslint/no-unused-vars",
          severity: 1,
        }),
      ])
    },
  )

  it.each([
    "@game/data/assets/controller-prompts/ControllerPrompts.png",
    "@game/data/assets/mapachito/ice-cream.riv",
  ])("allows native bundled asset %s", async (assetPath) => {
    const results = await eslint.lintText(
      `export const asset = require('${assetPath}')`,
      { filePath: "apps/mobile/components/NativeIntroduction.tsx" },
    )

    expect(results[0]?.messages).toEqual([])
  })

  it.each([
    "export const asset = require('react-native')",
    "export const asset = require('@game/data/src/Value')",
    "export const asset = require('@game/data/assets/fixture.ts')",
    "export function load(path: string) { return require(path) }",
  ])("still rejects ordinary native module requires: %s", async (source) => {
    const results = await eslint.lintText(source, {
      filePath: "apps/mobile/components/NativeIntroduction.tsx",
    })

    expect(results[0]?.messages).toEqual([
      expect.objectContaining({
        ruleId: "@typescript-eslint/no-require-imports",
      }),
    ])
  })

  it("does not extend Metro's asset exception to web", async () => {
    const results = await eslint.lintText(
      "export const asset = require('@game/data/assets/mapachito/ice-cream.png')",
      { filePath: "apps/web/components/InformationPanel.tsx" },
    )

    expect(results[0]?.messages).toEqual([
      expect.objectContaining({
        ruleId: "@typescript-eslint/no-require-imports",
      }),
    ])
  })

  it("preserves the ambient GIF declaration only in its owning module", async () => {
    const source =
      '/// <reference path="./gifenc.d.ts" />\nexport const value = 1'
    const allowed = await eslint.lintText(source, {
      filePath: "packages/utils/src/EncodeGif.ts",
    })
    const rejected = await eslint.lintText(source, {
      filePath: "packages/utils/src/lint-probe.ts",
    })

    expect(allowed[0]?.messages).toEqual([])
    expect(rejected[0]?.messages).toEqual([
      expect.objectContaining({
        ruleId: "@typescript-eslint/triple-slash-reference",
      }),
    ])
  })

  it("does not apply TypeScript require rules to Metro's JavaScript config", async () => {
    const results = await eslint.lintText(
      "module.exports = require('expo/metro-config')",
      { filePath: "apps/mobile/metro.config.js" },
    )

    expect(results[0]?.messages).toEqual([])
  })

  it.each([
    "node_modules/fixture/index.ts",
    "apps/web/.next/types/routes.ts",
    "apps/web/next-env.d.ts",
    "packages/utils/dist/EncodeGif.d.ts",
    "coverage/lint-probe.ts",
    "vendor/lint-probe.ts",
    "repomix-temp.lint-probe.ts",
  ])("keeps generated and private files ignored: %s", async (filePath) => {
    await expect(eslint.isPathIgnored(filePath)).resolves.toBe(true)
  })
})
