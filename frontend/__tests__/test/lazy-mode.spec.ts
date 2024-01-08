import { replaceAccents } from "../../src/ts/test/lazy-mode";

describe("lazy-mode", () => {
  describe("replaceAccents", () => {
    it("should replace common accents", () => {
      const result = replaceAccents("Héllö");
      expect(result).toBe("Hello");
    });
    it("should replace common accents with override", () => {
      const result = replaceAccents("Héllö", [["ö", "oe"]]);
      expect(result).toBe("Hélloe");
    });
  });
});
