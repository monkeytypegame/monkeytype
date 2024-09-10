import { rank } from "../src/format";
describe("format.ts", () => {
  describe("rank", () => {
    it("should format with default fallback", () => {
      expect(rank(1)).toEqual("1st");
      expect(rank(2)).toEqual("2nd");
      expect(rank(3)).toEqual("3rd");
      expect(rank(4)).toEqual("4th");

      expect(rank(11)).toEqual("11th");
      expect(rank(12)).toEqual("12th");
      expect(rank(13)).toEqual("13th");
      expect(rank(14)).toEqual("14th");

      expect(rank(21)).toEqual("21st");
      expect(rank(22)).toEqual("22nd");
      expect(rank(23)).toEqual("23rd");
      expect(rank(24)).toEqual("24th");
    });

    it("should format with fallback", () => {
      expect(rank(0)).toEqual("0th");
      expect(rank(null)).toEqual("-");
      expect(rank(undefined)).toEqual("-");

      expect(rank(0, {})).toEqual("0th");
      expect(rank(null, {})).toEqual("-");
      expect(rank(undefined, {})).toEqual("-");

      expect(rank(0, { fallback: "none" })).toEqual("0th");
      expect(rank(null, { fallback: "none" })).toEqual("none");
      expect(rank(undefined, { fallback: "none" })).toEqual("none");

      expect(rank(0, { fallback: "" })).toEqual("0th");
      expect(rank(null, { fallback: "" })).toEqual("");
      expect(rank(undefined, { fallback: "" })).toEqual("");
    });
  });
});
