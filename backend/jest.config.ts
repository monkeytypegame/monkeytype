import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup-tests.ts"],
  modulePathIgnorePatterns: ["<rootDir>/__tests__/setup-tests.ts"],
  moduleNameMapper: { "^uuid$": "uuid", "^msgpackr$": "msgpackr" },
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
