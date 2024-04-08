import { replaceAccents } from "../../src/ts/test/lazy-mode";

let germanAccents = [
  ["ö", "oe"],
  ["ä", "ae"],
  ["ü", "ue"],
] as [string, string][];

describe("lazy-mode", () => {
  describe("replaceAccents", () => {
    it("should replace common accents", () => {
      const result = replaceAccents("Héllö");
      expect(result).toBe("Hello");
    });
    it("should extend common accents with additional accents", () => {
      const result = replaceAccents("Héllö", [["ö", "oe"]]);
      expect(result).toBe("Helloe");
    });
    it("should remove accent if empty", () => {
      const result = replaceAccents("خصوصًا", [["ٌ", ""]]);
      expect(result).toBe("خصوصا");
    });
    it("should ignore empty word", () => {
      const result = replaceAccents("");
      expect(result).toBe("");
    });
    describe("german accents", () => {
      it("should replace additional accents", () => {
        const result = replaceAccents("Tränenüberströmt", germanAccents);
        expect(result).toBe("Traenenueberstroemt");
      });
      it("should replace starting with uppercase accent", () => {
        const result = replaceAccents("Äpfel", germanAccents);
        expect(result).toBe("Aepfel");
      });
      it("should replace common accents", () => {
        const result = replaceAccents("äße", germanAccents);
        expect(result).toBe("aesse");
      });
    });
  });
});
