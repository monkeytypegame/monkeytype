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
    "vitest.config.ts",
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
        //not using
        "@typescript-eslint/non-nullable-type-assertion-style": "off",
        "import/namespace": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/switch-exhaustiveness-check": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/unbound-method": "off",
        //unnecessary, might aswell keep template strings in case a string might be added in the future
        "@typescript-eslint/no-unnecessary-template-expression": "off",
        "@typescript-eslint/prefer-promise-reject-errors": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",

        //todo: consider some of these?
        //936, no options on this one. super strict, it doesnt allow casting to a narrower type
        "@typescript-eslint/no-unsafe-type-assertion": "off",
        //224 errors, very easy to fix.
        // adds unnecessary promise overhead and pushing the function to the microtask queue, creating a delay
        // all though performance impact probably minimal
        // anything that needs to be absolutely as fast as possible should not be async (if not using await)
        "@typescript-eslint/require-await": "off",
        //388, when allowing numbers only 27, when also allowing arrays 12
        // could be nice to avoid some weird things showing up in templated strings
        "@typescript-eslint/restrict-template-expressions": [
          "off",
          {
            allowNumber: true,
            allowArray: true,
          },
        ],

        //using
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          { ignoreArrowShorthand: true },
        ],
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
        "@typescript-eslint/no-invalid-void-type": "error",
        "@typescript-eslint/no-array-delete": "error",
        "@typescript-eslint/no-base-to-string": "error",
        "@typescript-eslint/no-duplicate-type-constituents": "error",
        "@typescript-eslint/no-for-in-array": "error",
        "@typescript-eslint/no-implied-eval": "error",
        "@typescript-eslint/no-meaningless-void-operator": "error",
        "@typescript-eslint/no-mixed-enums": "error",
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
        "@typescript-eslint/no-unsafe-enum-comparison": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/no-unsafe-unary-minus": "error",
        "@typescript-eslint/prefer-reduce-type-parameter": "error",
        "@typescript-eslint/prefer-return-this-type": "error",
        "@typescript-eslint/related-getter-setter-pairs": "error",
        "@typescript-eslint/require-array-sort-compare": "error",
        "@typescript-eslint/return-await": "error",
        "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/no-unnecessary-type-arguments": "error",
        "@typescript-eslint/restrict-plus-operands": [
          "error",
          {
            allowNumberAndString: true,
          },
        ],

        //handled by oxlint
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-empty-function": "off",
        "no-empty": "off",
        "@typescript-eslint/only-throw-error": "error",
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
