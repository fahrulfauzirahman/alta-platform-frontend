import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import ts from "typescript-eslint";

export default [
  { ignores: ["**/dist/**", "**/build/**", "**/.svelte-kit/**", "**/coverage/**", "**/playwright-report/**", "**/test-results/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  { files: ["**/*.svelte"], languageOptions: { parserOptions: { parser: ts.parser } }, rules: { "@typescript-eslint/no-unused-vars": "off", "no-undef": "off" } },
  { files: ["**/*.ts"], rules: { "no-undef": "off" } },
  { files: ["scripts/**/*.mjs", "**/*.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly" } } },
  { rules: { "@typescript-eslint/no-explicit-any": "error" } }
];
