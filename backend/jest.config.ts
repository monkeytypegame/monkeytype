import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  coverageThreshold: {
    global: {
      // These percentages should never decrease
      statements: 38,
      branches: 38,
      functions: 22,
      lines: 42,
    },
  },
};
