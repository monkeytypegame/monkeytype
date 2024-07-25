import { hexToRgb } from "../../src/ts/utils/colors";

describe("colors.ts", () => {
  describe("hexToRgb", () => {
    it("Invalid hex values", () => {
      expect(hexToRgb("ffff")).toEqual(undefined);
      expect(hexToRgb("fff0000")).toEqual(undefined);
      expect(hexToRgb("#ff")).toEqual(undefined);
      expect(hexToRgb("ffffff")).toEqual(undefined);
      expect(hexToRgb("fff")).toEqual(undefined);
    });
    it("Valid hex value", () => {
      expect(hexToRgb("#ffffff")).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
      expect(hexToRgb("#000000")).toEqual({
        r: 0,
        g: 0,
        b: 0,
      });
      expect(hexToRgb("#fff")).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
      expect(hexToRgb("#000")).toEqual({
        r: 0,
        g: 0,
        b: 0,
      });
      expect(hexToRgb("#ff0000")).toEqual({
        r: 255,
        g: 0,
        b: 0,
      });
      expect(hexToRgb("#00ff00")).toEqual({
        r: 0,
        g: 255,
        b: 0,
      });
      expect(hexToRgb("#0000ff")).toEqual({
        r: 0,
        g: 0,
        b: 255,
      });
      expect(hexToRgb("#f00")).toEqual({
        r: 255,
        g: 0,
        b: 0,
      });
      expect(hexToRgb("#0f0")).toEqual({
        r: 0,
        g: 255,
        b: 0,
      });
      expect(hexToRgb("#00f")).toEqual({
        r: 0,
        g: 0,
        b: 255,
      });
      expect(hexToRgb("#123456")).toEqual({
        r: 18,
        g: 52,
        b: 86,
      });
    });
  });
});
