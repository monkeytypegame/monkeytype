import { describe, it, expect } from "vitest";
import * as Configurations from "../../src/init/configuration";

import { Configuration } from "@monkeytype/schemas/configuration";
const mergeConfigurations = Configurations.__testing.mergeConfigurations;

describe("configurations", () => {
  describe("mergeConfigurations", () => {
    it("should merge configurations correctly", () => {
      //GIVEN
      const baseConfig: Configuration = {
        maintenance: false,
        dev: {
          responseSlowdownMs: 5,
        },
        quotes: {
          reporting: {
            enabled: false,
            maxReports: 5,
          },
          submissionEnabled: true,
        },
      } as any;
      const liveConfig: Partial<Configuration> = {
        maintenance: true,
        quotes: {
          reporting: {
            enabled: true,
          } as any,
          maxFavorites: 10,
        } as any,
      };

      //WHEN
      mergeConfigurations(baseConfig, liveConfig);

      //THEN
      expect(baseConfig).toEqual({
        maintenance: true,
        dev: {
          responseSlowdownMs: 5,
        },
        quotes: {
          reporting: {
            enabled: true,
            maxReports: 5,
          },
          submissionEnabled: true,
        },
      } as any);
    });
  });
});
