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
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
    "plugin:oxlint/recommended",
  ],
  plugins: ["require-path-exists", "@typescript-eslint"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    indent: ["off"],
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

    //handled by oxlint
    "no-duplicates": "off",
    "no-var": "off",
    "no-empty": "off",
    "no-named-as-default": "off",
    "prefer-const": "off",
    "prefer-rest-params": "off",
    "prefer-spread": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-duplicates": "off",
    "import/export": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-inner-declarations": "off",
    "no-prototype-builtins": "off",
    "no-regex-spaces": "off",
    "no-redeclare": "off",
  },
  overrides: [
    {
      files: ["*.json"],
      extends: ["plugin:json/recommended"],
      plugins: ["json"],
      rules: {
        "json/*": ["error"],
      },
    },
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
        "plugin:oxlint/recommended",
      ],
      rules: {
        //strict type checked
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-unnecessary-template-expression": "off",
        "@typescript-eslint/prefer-promise-reject-errors": "off",
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
          { allowNullableBoolean: true },
        ],
        "@typescript-eslint/non-nullable-type-assertion-style": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/no-invalid-void-type": "off",
        "import/namespace": "off",

        //handled by oxlint
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-empty-function": "off",
        "no-empty": "off",
        "@typescript-eslint/only-throw-error": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/no-var-requires": "off",
        "no-named-as-default": "off",
        "no-duplicates": "off",
        "@typescript-eslint/no-array-constructor": "off",
        "@typescript-eslint/no-extraneous-class": "off",
        "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unnecessary-type-constraint": "off",
        "@typescript-eslint/no-useless-constructor": "off",
        "@typescript-eslint/prefer-literal-enum-member": "off",
        "@typescript-eslint/prefer-namespace-keyword": "off",
        "no-var": "off",
        "prefer-const": "off",
        "prefer-rest-params": "off",
        "prefer-spread": "off",
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
        "import/no-duplicates": "off",
        "import/export": "off",
        "no-case-declarations": "off",
        "no-fallthrough": "off",
        "no-inner-declarations": "off",
        "no-prototype-builtins": "off",
        "no-regex-spaces": "off",
        "no-redeclare": "off",
        "@typescript-eslint/no-namespace": "off",
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
