import { hexToRgb } from "../../src/ts/utils/colors";

describe("colors.ts", () => {
  describe("hexToRgb", () => {
    it("Invalid hex values", () => {
      expect(hexToRgb("ffff")).toEqual(undefined);
      expect(hexToRgb("fff0000")).toEqual(undefined);
      expect(hexToRgb("#ff")).toEqual(undefined);
    });
    it("Valid hex value", () => {
      expect(hexToRgb("#123456")).toEqual({
        r: 18,
        g: 52,
        b: 86,
      });
    });
  });
});
