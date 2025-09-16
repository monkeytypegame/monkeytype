/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  plugins: ["compat"],
  extends: ["@monkeytype/eslint-config", "plugin:compat/recommended"],
  globals: {
    $: "readonly",
    jQuery: "readonly",
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
  rules: {
    // Prevent accessing __testing outside of test files
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[property.name='__testing']",
        message:
          "__testing should only be accessed in test files. Use the public API instead.",
      },
    ],
    '@typescript-eslint/no-base-to-string': 'off',
  },
  overrides: [
    {
      // Allow __testing access in test files
      files: [
        "**/__tests__/**/*.{js,ts,tsx}",
        "**/*.{test,spec}.{js,ts,tsx}",
        "**/tests/**/*.{js,ts,tsx}",
      ],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
  ],
};
