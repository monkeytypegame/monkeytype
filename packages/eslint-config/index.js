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
        "@typescript-eslint/no-useless-template-literals": "off",
        "@typescript-eslint/prefer-promise-reject-errors": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-unnecessary-type-arguments": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/restrict-plus-operands": "off",

        // TODO: enable at some point
        "@typescript-eslint/no-unsafe-return": "off", //~12
        "@typescript-eslint/no-unsafe-assignment": "off", //~63
        "@typescript-eslint/no-unsafe-argument": "off", //~37
        "@typescript-eslint/no-unsafe-call": "off", //~76
        "@typescript-eslint/no-unsafe-member-access": "off", //~105
        //

        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          { ignoreArrowShorthand: true },
        ],
        "@typescript-eslint/explicit-function-return-type": ["error"],
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^(_|e|event)", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: false,
          },
        ],
        "@typescript-eslint/promise-function-async": "warn",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/strict-boolean-expressions": [
          "error",
          { allowNullableBoolean: true, allowNullableNumber: true },
        ],
        "@typescript-eslint/non-nullable-type-assertion-style": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
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
