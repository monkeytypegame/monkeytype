import * as Numbers from "../../src/ts/utils/numbers";

describe("numbers", () => {
  describe("abbreviateNumber", () => {
    it("should round to one decimal by default", () => {
      expect(Numbers.abbreviateNumber(1)).toEqual("1.0");
      expect(Numbers.abbreviateNumber(1.5)).toEqual("1.5");
      expect(Numbers.abbreviateNumber(1.55)).toEqual("1.6");

      expect(Numbers.abbreviateNumber(1000)).toEqual("1.0k");
      expect(Numbers.abbreviateNumber(1010)).toEqual("1.0k");
      expect(Numbers.abbreviateNumber(1099)).toEqual("1.1k");
    });
    it("should round to full numbers", () => {
      expect(Numbers.abbreviateNumber(1, 0)).toEqual("1");
      expect(Numbers.abbreviateNumber(1.5, 0)).toEqual("2");
      expect(Numbers.abbreviateNumber(1.55, 0)).toEqual("2");

      expect(Numbers.abbreviateNumber(1000, 0)).toEqual("1k");
      expect(Numbers.abbreviateNumber(1010, 0)).toEqual("1k");
      expect(Numbers.abbreviateNumber(1099, 0)).toEqual("1k");
    });

    it("should round to two decimals", () => {
      expect(Numbers.abbreviateNumber(1, 2)).toEqual("1.00");
      expect(Numbers.abbreviateNumber(1.5, 2)).toEqual("1.50");
      expect(Numbers.abbreviateNumber(1.55, 2)).toEqual("1.55");

      expect(Numbers.abbreviateNumber(1000, 2)).toEqual("1.00k");
      expect(Numbers.abbreviateNumber(1010, 2)).toEqual("1.01k");
      expect(Numbers.abbreviateNumber(1099, 2)).toEqual("1.10k");
    });
    it("should use suffixes", () => {
      let number = 1;
      expect(Numbers.abbreviateNumber(number)).toEqual("1.0");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0k");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0m");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0b");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0t");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0q");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0Q");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0s");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0S");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0o");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0n");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0d");
    });
  });
  describe("parseIntOptional", () => {
    it("should return a number when given a valid string", () => {
      expect(Numbers.parseIntOptional("123")).toBe(123);
      expect(Numbers.parseIntOptional("42")).toBe(42);
      expect(Numbers.parseIntOptional("0")).toBe(0);
    });

    it("should return undefined when given null", () => {
      expect(Numbers.parseIntOptional(null)).toBeUndefined();
    });

    it("should return undefined when given undefined", () => {
      expect(Numbers.parseIntOptional(undefined)).toBeUndefined();
    });

    it("should handle non-numeric strings", () => {
      expect(Numbers.parseIntOptional("abc")).toBeNaN();
      expect(Numbers.parseIntOptional("12abc")).toBe(12); // parseInt stops at non-numeric chars
    });

    it("should handle leading and trailing spaces", () => {
      expect(Numbers.parseIntOptional(" 42 ")).toBe(42);
    });
    it("should return a number when given a valid string and radix", () => {
      expect(Numbers.parseIntOptional("1010", 2)).toBe(10);
      expect(Numbers.parseIntOptional("CF", 16)).toBe(207);
      expect(Numbers.parseIntOptional("C", 26)).toBe(12);
    });
  });
});
