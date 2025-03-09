/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@monkeytype/eslint-config"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "__tests__/",
    "jest.config.ts",
    "__migration__/",
  ],
  rules: {
    eqeqeq: "error",
  },
};
