/** @type {import("eslint").Linter.Config} */
module.exports = {
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
    "build/",
  ],
  extends: [
    "eslint:recommended",
    "plugin:json/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["json", "require-path-exists", "@typescript-eslint"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    "json/*": ["error"],
    indent: ["off"],
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-var": 2,
    "no-duplicate-imports": ["error"],
    "no-constant-condition": ["error"],
    "no-constant-binary-expression": "error",
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^(_|e|event)",
        caughtErrorsIgnorePattern: "^(_|e|error)",
        varsIgnorePattern: "^_",
      },
    ],
    "import/no-duplicates": "off",
    "import/no-unresolved": [
      "error",
      {
        ignore: ["^@monkeytype/"],
      },
    ],
    "no-mixed-operators": [
      "error",
      {
        groups: [["+", "??"]],
      },
    ],
  },
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/strict",
        "plugin:@typescript-eslint/strict-type-checked",
      ],
      rules: {
        //strict type checked
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-unnecessary-template-expression": "off",
        "@typescript-eslint/prefer-promise-reject-errors": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-unnecessary-type-arguments": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/restrict-plus-operands": "off",

        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          { ignoreArrowShorthand: true },
        ],
        "@typescript-eslint/explicit-function-return-type": [
          "error",
          {
            allowExpressions: true,
          },
        ],
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^(_|e|event)",
            caughtErrorsIgnorePattern: "^(_|e|error)",
            varsIgnorePattern: "^_",
          },
        ],
        "@typescript-eslint/no-unused-expressions": [
          "error",
          {
            allowTernary: true,
          },
        ],
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: false,
          },
        ],
        "@typescript-eslint/promise-function-async": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/strict-boolean-expressions": [
          "error",
          { allowNullableBoolean: true, allowNullableNumber: true },
        ],
        "@typescript-eslint/non-nullable-type-assertion-style": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        "@typescript-eslint/no-invalid-void-type": "off",
        "import/namespace": "off",
      },
      settings: {
        "import/resolver": {
          typescript: {
            project: "./tsconfig.json",
          },
        },
      },
      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
        project: "**/tsconfig.json",
      },
    },
  ],
};
