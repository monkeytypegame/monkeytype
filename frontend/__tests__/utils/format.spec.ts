import * as Format from "../../src/ts/utils/format";
import Config from "../../src/ts/config";

const configMock: Partial<SharedTypes.Config> = {};

describe("format.ts", () => {
  beforeEach(() => {
    Config.typingSpeedUnit = "wpm";
    Config.alwaysShowDecimalPlaces = false;
  });
  describe("typingsSpeed", () => {
    it("should format with typing speed and decimalPlaces from configuration", () => {
      //wpm, no decimals
      Config.typingSpeedUnit = "wpm";
      Config.alwaysShowDecimalPlaces = false;
      expect(Format.typingSpeed(12.5)).toEqual("13");
      expect(Format.typingSpeed(0)).toEqual("0");

      //cpm, no decimals
      Config.typingSpeedUnit = "cpm";
      Config.alwaysShowDecimalPlaces = false;
      expect(Format.typingSpeed(12.5)).toEqual("63");
      expect(Format.typingSpeed(0)).toEqual("0");

      //wpm, with decimals
      Config.typingSpeedUnit = "wpm";
      Config.alwaysShowDecimalPlaces = true;
      expect(Format.typingSpeed(12.5)).toEqual("12.50");
      expect(Format.typingSpeed(0)).toEqual("0.00");

      //cpm, with decimals
      Config.typingSpeedUnit = "cpm";
      Config.alwaysShowDecimalPlaces = true;
      expect(Format.typingSpeed(12.5)).toEqual("62.50");
      expect(Format.typingSpeed(0)).toEqual("0.00");
    });

    it("should format with fallback", () => {
      //default fallback
      expect(Format.typingSpeed(null)).toEqual("-");
      expect(Format.typingSpeed(undefined)).toEqual("-");

      //provided fallback
      expect(Format.typingSpeed(null, { fallback: "none" })).toEqual("none");
      expect(Format.typingSpeed(null, { fallback: "" })).toEqual("");
      expect(Format.typingSpeed(undefined, { fallback: "none" })).toEqual(
        "none"
      );

      expect(Format.typingSpeed(undefined, { fallback: "" })).toEqual("");
      expect(Format.typingSpeed(undefined, { fallback: undefined })).toEqual(
        ""
      );
    });

    it("should format with decimals", () => {
      //force with decimals
      Config.alwaysShowDecimalPlaces = false;
      expect(Format.typingSpeed(100, { showDecimalPlaces: true })).toEqual(
        "100.00"
      );
      //force without decimals
      Config.alwaysShowDecimalPlaces = true;
      expect(Format.typingSpeed(100, { showDecimalPlaces: false })).toEqual(
        "100"
      );
    });

    it("should format with suffix", () => {
      expect(Format.typingSpeed(100, { suffix: " raw" })).toEqual("100 raw");
      expect(Format.typingSpeed(100, { suffix: undefined })).toEqual("100");
      expect(Format.typingSpeed(0, { suffix: " raw" })).toEqual("0 raw");
      expect(Format.typingSpeed(null, { suffix: " raw" })).toEqual("-");
      expect(Format.typingSpeed(undefined, { suffix: " raw" })).toEqual("-");
    });
  });
  describe("percentage", () => {
    it("should format with decimalPlaces from configuration", () => {
      //no decimals
      Config.alwaysShowDecimalPlaces = false;
      expect(Format.percentage(12.5)).toEqual("13%");
      expect(Format.percentage(0)).toEqual("0%");

      //with decimals
      Config.alwaysShowDecimalPlaces = true;
      expect(Format.percentage(12.5)).toEqual("12.50%");
      expect(Format.percentage(0)).toEqual("0.00%");
    });

    it("should format with fallback", () => {
      //default fallback
      expect(Format.percentage(null)).toEqual("-");
      expect(Format.percentage(undefined)).toEqual("-");

      //provided fallback
      expect(Format.percentage(null, { fallback: "none" })).toEqual("none");
      expect(Format.percentage(null, { fallback: "" })).toEqual("");
      expect(Format.percentage(undefined, { fallback: "none" })).toEqual(
        "none"
      );

      expect(Format.percentage(undefined, { fallback: "" })).toEqual("");
      expect(Format.percentage(undefined, { fallback: undefined })).toEqual("");
    });

    it("should format with decimals", () => {
      //force with decimals
      Config.alwaysShowDecimalPlaces = false;
      expect(Format.percentage(100, { showDecimalPlaces: true })).toEqual(
        "100.00%"
      );
      //force without decimals
      Config.alwaysShowDecimalPlaces = true;
      expect(Format.percentage(100, { showDecimalPlaces: false })).toEqual(
        "100%"
      );
    });

    it("should format with suffix", () => {
      expect(Format.percentage(100, { suffix: " raw" })).toEqual("100% raw");
      expect(Format.percentage(100, { suffix: undefined })).toEqual("100%");
      expect(Format.percentage(0, { suffix: " raw" })).toEqual("0% raw");
      expect(Format.percentage(null, { suffix: " raw" })).toEqual("-");
      expect(Format.percentage(undefined, { suffix: " raw" })).toEqual("-");
    });
  });
});
