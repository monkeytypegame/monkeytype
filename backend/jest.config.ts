import { defaults as tsjPreset } from "ts-jest/presets";

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
