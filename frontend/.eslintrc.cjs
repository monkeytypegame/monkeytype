/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  plugins: ["compat"],
  extends: ["@monkeytype/eslint-config", "plugin:compat/recommended"],
  globals: {
    $: "readonly",
    jQuery: "readonly",
    html2canvas: "readonly",
    ClipboardItem: "readonly",
    grecaptcha: "readonly",
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "static/js/",
    "__tests__/",
    "jest.config.ts",
  ],
  settings: {
    lintAllEsApis: true,
  },
};
