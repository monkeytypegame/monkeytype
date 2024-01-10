import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "ts-jest",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup-tests.ts"],
  modulePathIgnorePatterns: ["<rootDir>/__tests__/setup-tests.ts"],
  testRegex: "(/__tests__/.*|(\\.|/)(spec))\\.[jt]sx?$", //prevent files like test.ts outside the __tests__ folder to be detected as test
};
