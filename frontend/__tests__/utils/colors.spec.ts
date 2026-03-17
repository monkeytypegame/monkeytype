import { describe, it, expect } from "vitest";
import { hexToRgb, blendTwoHexColors } from "../../src/ts/utils/colors";

describe("colors.ts", () => {
  describe("hexToRgb", () => {
    it("Invalid hex values", () => {
      expect(hexToRgb("ffff")).toEqual(undefined);
      expect(hexToRgb("fff0000")).toEqual(undefined);
      expect(hexToRgb("#ff")).toEqual(undefined);
      expect(hexToRgb("ffffff")).toEqual(undefined);
      expect(hexToRgb("fff")).toEqual(undefined);
      expect(hexToRgb("#ffffffffff")).toEqual(undefined); // Too long
    });
    it("Valid hex value without alpha", () => {
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

    it("Valid hex value with alpha (RGBA format)", () => {
      expect(hexToRgb("#ffff")).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      });
      expect(hexToRgb("#fff0")).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 0,
      });
      expect(hexToRgb("#f008")).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 0.5333333333333333, // 0x88 / 255
      });
    });

    it("Valid hex value with alpha (RRGGBBAA format)", () => {
      expect(hexToRgb("#ffffffff")).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      });
      expect(hexToRgb("#ffffff00")).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 0,
      });
      expect(hexToRgb("#ff000080")).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 0.5019607843137255, // 0x80 / 255
      });
      expect(hexToRgb("#00000000")).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      });
      expect(hexToRgb("#123456ff")).toEqual({
        r: 18,
        g: 52,
        b: 86,
        a: 1,
      });
    });
  });

  describe("blendTwoHexColors", () => {
    const cases = [
      {
        color1: "#ffffff",
        color2: "#000000",
        alpha: 0.5,
        expected: "#808080",
        display: "no opacity",
      },
      {
        color1: "#ffffff00",
        color2: "#000000",
        alpha: 0.5,
        expected: "#80808080",
        display: "mixed opacity",
      },
      {
        color1: "#ffffffff",
        color2: "#00000000",
        alpha: 0.5,
        expected: "#80808080",
        display: "with opacity",
      },
    ];

    it.each(cases)(
      "should blend colors correctly ($display)",
      ({ color1, color2, alpha, expected }) => {
        const result = blendTwoHexColors(color1, color2, alpha);
        expect(result).toBe(expected);
      },
    );

    // cases.forEach(({ color1, color2, alpha, expected }) => {
    //   const result = blendTwoHexColors(color1, color2, alpha);
    //   expect(result).toBe(expected);
    // });
  });
});
