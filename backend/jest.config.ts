import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  coverageThreshold: {
    global: {
      branches: 36,
      functions: 18,
      lines: 39,
      statements: 35,
    },
  },
};
