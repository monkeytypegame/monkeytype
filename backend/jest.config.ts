import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  coverageThreshold: {
    global: {
      // These percentages should never decrease
      statements: 37,
      branches: 38,
      functions: 20,
      lines: 40,
    },
  },
};
