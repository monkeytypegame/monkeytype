import { migrateConfig } from "../../src/ts/utils/config";
import DefaultConfig from "../../src/ts/constants/default-config";
import {
  PartialConfig,
  ShowAverageSchema,
} from "@monkeytype/contracts/schemas/configs";

describe("config.ts", () => {
  describe("migrateConfig", () => {
    it("should carry over properties from the default config", () => {
      const partialConfig = {} as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(DefaultConfig));
      for (const [key, value] of Object.entries(DefaultConfig)) {
        expect(result).toHaveProperty(key, value);
      }
    });
    it("should not merge properties which are not in the default config (legacy properties)", () => {
      const partialConfig = {
        legacy: true,
      } as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(DefaultConfig));
      expect(result).not.toHaveProperty("legacy");
    });
    it("should correctly merge properties of various types", () => {
      const partialConfig = {
        mode: "quote",
        hideExtraLetters: true,
        time: 120,
        accountChart: ["off", "off", "off", "off"],
      } as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result.mode).toEqual("quote");
      expect(result.hideExtraLetters).toEqual(true);
      expect(result.time).toEqual(120);
      expect(result.accountChart).toEqual(["off", "off", "off", "off"]);
    });
    it("should not convert legacy values if current values are already present", () => {
      const testCases = [
        {
          given: { showLiveAcc: true, timerStyle: "mini", liveAccStyle: "off" },
          expected: { liveAccStyle: "off" },
        },
        {
          given: {
            showLiveBurst: true,
            timerStyle: "mini",
            liveBurstStyle: "off",
          },
          expected: { liveBurstStyle: "off" },
        },
        {
          given: { quickTab: true, quickRestart: "enter" },
          expected: { quickRestart: "enter" },
        },
        {
          given: { swapEscAndTab: true, quickRestart: "enter" },
          expected: { quickRestart: "enter" },
        },
        {
          given: { alwaysShowCPM: true, typingSpeedUnit: "wpm" },
          expected: { typingSpeedUnit: "wpm" },
        },
        {
          given: { showTimerProgress: true, timerStyle: "mini" },
          expected: { timerStyle: "mini" },
        },
      ];

      //WHEN
      testCases.forEach((test) => {
        const description = `given: ${JSON.stringify(
          test.given
        )}, expected: ${JSON.stringify(test.expected)} `;

        const result = migrateConfig(test.given);
        expect(result, description).toEqual(
          expect.objectContaining(test.expected)
        );
      });
    });
    it("should convert legacy values", () => {
      const testCases = [
        { given: { quickTab: true }, expected: { quickRestart: "tab" } },
        { given: { smoothCaret: true }, expected: { smoothCaret: "medium" } },
        { given: { smoothCaret: false }, expected: { smoothCaret: "off" } },
        { given: { swapEscAndTab: true }, expected: { quickRestart: "esc" } },
        {
          given: { alwaysShowCPM: true },
          expected: { typingSpeedUnit: "cpm" },
        },
        { given: { showAverage: "wpm" }, expected: { showAverage: "speed" } },
        {
          given: { playSoundOnError: true },
          expected: { playSoundOnError: "1" },
        },
        {
          given: { playSoundOnError: false },
          expected: { playSoundOnError: "off" },
        },
        {
          given: { showTimerProgress: false },
          expected: { timerStyle: "off" },
        },
        {
          given: { showLiveWpm: true, timerStyle: "text" },
          expected: { liveSpeedStyle: "text" },
        },
        {
          given: { showLiveWpm: true, timerStyle: "bar" },
          expected: { liveSpeedStyle: "mini" },
        },
        {
          given: { showLiveWpm: true, timerStyle: "off" },
          expected: { liveSpeedStyle: "mini" },
        },
        {
          given: { showLiveBurst: true, timerStyle: "text" },
          expected: { liveBurstStyle: "text" },
        },
        {
          given: { showLiveBurst: true, timerStyle: "bar" },
          expected: { liveBurstStyle: "mini" },
        },
        {
          given: { showLiveBurst: true, timerStyle: "off" },
          expected: { liveBurstStyle: "mini" },
        },
        {
          given: { showLiveAcc: true, timerStyle: "text" },
          expected: { liveAccStyle: "text" },
        },
        {
          given: { showLiveAcc: true, timerStyle: "bar" },
          expected: { liveAccStyle: "mini" },
        },
        {
          given: { showLiveAcc: true, timerStyle: "off" },
          expected: { liveAccStyle: "mini" },
        },
        { given: { soundVolume: "0.5" }, expected: { soundVolume: 0.5 } },
      ];

      //WHEN
      testCases.forEach((test) => {
        const description = `given: ${JSON.stringify(
          test.given
        )}, expected: ${JSON.stringify(test.expected)} `;

        const result = migrateConfig(test.given);
        expect(result, description).toEqual(
          expect.objectContaining(test.expected)
        );
      });
    });
  });
});
