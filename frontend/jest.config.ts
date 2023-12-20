import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup-tests.ts"],
  modulePathIgnorePatterns: ["<rootDir>/__tests__/setup-tests.ts"],
  testRegex: "(/__tests__/.*|(\\.|/)(spec))\\.[jt]sx?$",

  coverageThreshold: {
    global: {
      // These percentages should never decrease
      statements: 40,
      branches: 37,
      functions: 25,
      lines: 43,
    },
  },
};
