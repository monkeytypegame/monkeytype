import { mergeWithDefaultConfig } from "../../src/ts/utils/config";
import DefaultConfig from "../../src/ts/constants/default-config";

describe("config.ts", () => {
  describe("mergeWithDefaultConfig", () => {
    it("should carry over properties from the default config", () => {
      const partialConfig = {} as Partial<SharedTypes.Config>;

      const result = mergeWithDefaultConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(DefaultConfig));
      for (const [key, value] of Object.entries(DefaultConfig)) {
        expect(result).toHaveProperty(key, value);
      }
    });
    it("should not merge properties which are not in the default config (legacy properties)", () => {
      const partialConfig = {
        legacy: true,
      } as Partial<SharedTypes.Config>;

      const result = mergeWithDefaultConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(DefaultConfig));
      expect(result).not.toHaveProperty("legacy");
    });
    it("should correctly merge properties of various types", () => {
      const partialConfig = {
        mode: "quote",
        hideExtraLetters: true,
        time: 120,
        accountChart: ["off", "off", "off", "off"],
      } as Partial<SharedTypes.Config>;

      const result = mergeWithDefaultConfig(partialConfig);
      expect(result.mode).toEqual("quote");
      expect(result.hideExtraLetters).toEqual(true);
      expect(result.time).toEqual(120);
      expect(result.accountChart).toEqual(["off", "off", "off", "off"]);
    });
  });
});
