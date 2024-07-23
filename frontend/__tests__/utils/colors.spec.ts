import { hexToRgb } from "../../src/ts/utils/colors";

describe("colors.ts", () => {
  describe("hexToRgb", () => {
    it("Invalid hex values", () => {
      expect(hexToRgb("ffff")).toEqual(undefined);
      expect(hexToRgb("fff0000")).toEqual(undefined);
      expect(hexToRgb("#ff")).toEqual(undefined);
    });
    it("Valid hex value", () => {
      expect(hexToRgb("#ff0000")).toEqual({
        r: 255,
        g: 0,
        b: 0,
      });
    });
  });
});
